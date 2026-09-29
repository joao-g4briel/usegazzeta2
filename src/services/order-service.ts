import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/errors";
import { toCents, toNumber } from "@/lib/money";
import { ORDER_STATUS_FLOW, type OrderStatus, type ShippingMethod } from "@/lib/constants";
import { variantDetails, variantLabel } from "@/lib/variant";
import type { CheckoutInput } from "@/lib/validations/order";
import { changeStock } from "@/services/inventory-service";
import { consumeCoupon, evaluateCoupon, releaseCoupon, type CouponEvaluation } from "@/services/coupon-service";
import { cents, mergeItems, priceLines, sumCents } from "@/services/pricing-service";
import { pickImage, priceOf } from "@/services/mappers";
import type { StoreInfo } from "@/services/store-service";
import type { OrderListItem } from "@/types/catalog";

export function shippingCentsFor(store: StoreInfo, method: ShippingMethod, merchandiseCents: number) {
  if (method === "RETIRADA") return 0;
  const threshold = store.freeShippingThreshold === null ? null : toCents(store.freeShippingThreshold);
  if (threshold !== null && merchandiseCents >= threshold) return 0;
  return toCents(store.shippingFlatRate);
}

export type CartQuoteLine = {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  categoryName: string;
  variantKind: import("@/lib/constants").VariantKind;
  label: string;
  details: { label: string; value: string }[];
  image: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  requested: number;
  quantity: number;
  stock: number;
  subtotal: number;
  issue: "unavailable" | "reduced" | null;
};

export type CartQuote = {
  lines: CartQuoteLine[];
  subtotal: number;
  discount: number;
  coupon: { code: string; description: string } | null;
  couponError: string | null;
  shipping: number;
  freeShippingRemaining: number | null;
  total: number;
  itemCount: number;
};

/** Recalcula a sacola da loja com preços e estoque atuais do banco. */
export async function quoteCart(
  store: StoreInfo,
  items: { variantId: string; quantity: number }[],
  options: { couponCode?: string | null; shippingMethod?: ShippingMethod } = {},
): Promise<CartQuote> {
  const merged = mergeItems(items).slice(0, 100);
  const variants = merged.length
    ? await prisma.productVariant.findMany({
        where: { id: { in: merged.map((i) => i.variantId) }, product: { storeId: store.id } },
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              active: true,
              category: { select: { name: true, variantKind: true } },
              images: { select: { url: true, variantId: true, isPrimary: true, position: true } },
            },
          },
        },
      })
    : [];

  const lines: CartQuoteLine[] = [];
  for (const item of items) {
    const v = variants.find((x) => x.id === item.variantId);
    if (!v || lines.some((l) => l.variantId === item.variantId)) continue;
    const requested = merged.find((m) => m.variantId === v.id)?.quantity ?? item.quantity;
    const sellable = v.active && v.product.active;
    const stock = sellable ? Math.max(0, v.stock) : 0;
    const quantity = Math.min(requested, stock);
    const unit = priceOf(v);
    const full = toNumber(v.salePrice);
    lines.push({
      variantId: v.id,
      productId: v.product.id,
      productSlug: v.product.slug,
      productName: v.product.name,
      categoryName: v.product.category.name,
      variantKind: v.product.category.variantKind,
      label: variantLabel(v),
      details: variantDetails(v),
      image: pickImage(v.product.images, v.id),
      unitPrice: unit,
      compareAtPrice: full > unit ? full : null,
      requested,
      quantity,
      stock,
      subtotal: (toCents(unit) * quantity) / 100,
      issue: stock === 0 ? "unavailable" : quantity < requested ? "reduced" : null,
    });
  }

  const subtotalCents = lines.reduce((s, l) => s + toCents(l.unitPrice) * l.quantity, 0);
  let discountCents = 0;
  let coupon: CartQuote["coupon"] = null;
  let couponError: string | null = null;
  if (options.couponCode && subtotalCents > 0) {
    try {
      const evaluation = await evaluateCoupon(prisma, store.id, options.couponCode, subtotalCents);
      discountCents = evaluation.discountCents;
      coupon = { code: evaluation.code, description: evaluation.description };
    } catch (error) {
      couponError = error instanceof DomainError ? error.message : "Cupom inválido.";
    }
  }
  const merchandise = subtotalCents - discountCents;
  const shippingCents = subtotalCents
    ? shippingCentsFor(store, options.shippingMethod ?? "ENTREGA", merchandise)
    : 0;
  const threshold = store.freeShippingThreshold === null ? null : toCents(store.freeShippingThreshold);

  return {
    lines,
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    coupon,
    couponError,
    shipping: shippingCents / 100,
    freeShippingRemaining:
      threshold !== null && merchandise < threshold ? (threshold - merchandise) / 100 : null,
    total: (merchandise + shippingCents) / 100,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
  };
}

/**
 * Pedido online: mesma regra do PDV. Recalcula tudo no servidor, reserva o estoque
 * da variante (VENDA_ONLINE) na mesma transação e registra o pagamento pendente.
 */
export async function placeOrder(store: StoreInfo, input: CheckoutInput, options: { createdAt?: Date } = {}) {
  return prisma.$transaction(
    async (tx) => {
      const lines = await priceLines(tx, store.id, input.items);
      const subtotalCents = sumCents(lines);

      let coupon: CouponEvaluation | null = null;
      if (input.couponCode) {
        coupon = await evaluateCoupon(tx, store.id, input.couponCode, subtotalCents, options.createdAt);
      }
      const discountCents = Math.min(subtotalCents, coupon?.discountCents ?? 0);
      const shippingCents = shippingCentsFor(store, input.shippingMethod, subtotalCents - discountCents);
      const totalCents = subtotalCents - discountCents + shippingCents;

      const customerData = {
        name: input.customer.name,
        phone: input.customer.phone,
        whatsapp: input.customer.whatsapp ?? input.customer.phone,
        ...(input.customer.cpf ? { cpf: input.customer.cpf } : {}),
      };
      const customer = await tx.customer.upsert({
        where: { storeId_email: { storeId: store.id, email: input.customer.email } },
        update: customerData,
        create: { storeId: store.id, email: input.customer.email, ...customerData },
      });

      let addressId: string | null = null;
      if (input.shippingMethod === "ENTREGA" && input.address) {
        const address = await tx.address.create({
          data: { customerId: customer.id, ...input.address, isDefault: true },
        });
        addressId = address.id;
      }

      const order = await tx.order.create({
        data: {
          storeId: store.id,
          customerId: customer.id,
          addressId,
          couponId: coupon?.couponId ?? null,
          shippingMethod: input.shippingMethod,
          subtotal: cents(subtotalCents),
          discount: cents(discountCents),
          shipping: cents(shippingCents),
          total: cents(totalCents),
          paymentMethod: input.paymentMethod,
          paymentStatus: "PENDING",
          orderStatus: "AGUARDANDO_PAGAMENTO",
          notes: input.notes,
          ...(options.createdAt ? { createdAt: options.createdAt } : {}),
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              productName: l.productName,
              variantLabel: l.variantLabel,
              quantity: l.quantity,
              unitPrice: cents(l.unitPriceCents),
              costPrice: cents(l.costCents),
              subtotal: cents(l.subtotalCents),
            })),
          },
          payments: {
            create: {
              method: input.paymentMethod,
              amount: cents(totalCents),
              status: "PENDING",
              ...(options.createdAt ? { createdAt: options.createdAt } : {}),
            },
          },
        },
      });

      for (const line of lines) {
        await changeStock(tx, {
          storeId: store.id,
          variantId: line.variantId,
          delta: -line.quantity,
          type: "VENDA_ONLINE",
          referenceType: "ORDER",
          referenceId: order.id,
          reason: `Pedido online #${order.number}`,
          createdAt: options.createdAt,
        });
      }

      if (coupon) await consumeCoupon(tx, coupon, { orderId: order.id, customerId: customer.id });

      return { id: order.id, number: order.number, total: totalCents / 100 };
    },
    { timeout: 20000 },
  );
}

/**
 * Atualiza o status. Cancelar devolve as peças ao estoque (CANCELAMENTO)
 * e libera o cupom; pedido cancelado não volta a outro status.
 */
export async function updateOrderStatus(
  storeId: string,
  userId: string | null,
  orderId: string,
  status: OrderStatus,
  options: { at?: Date } = {},
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, storeId }, include: { items: true } });
    if (!order) throw new DomainError("Pedido não encontrado.", "NOT_FOUND");
    if (order.orderStatus === status) return { number: order.number, status };
    if (order.orderStatus === "CANCELADO") {
      throw new DomainError("Pedido cancelado não pode mudar de status.", "ORDER_CANCELED");
    }

    if (status === "CANCELADO") {
      if (order.orderStatus === "ENTREGUE") {
        throw new DomainError(
          "Pedido entregue não pode ser cancelado. Registre a devolução em Estoque → Ajuste.",
          "ORDER_DELIVERED",
        );
      }
      const claimed = await tx.order.updateMany({
        where: { id: orderId, orderStatus: { not: "CANCELADO" } },
        data: {
          orderStatus: "CANCELADO",
          paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : "CANCELED",
        },
      });
      if (claimed.count === 0) throw new DomainError("Pedido já foi cancelado.", "ORDER_CANCELED");
      await tx.payment.updateMany({
        where: { orderId },
        data: { status: order.paymentStatus === "PAID" ? "REFUNDED" : "CANCELED" },
      });
      for (const item of [...order.items].sort((a, b) => a.variantId.localeCompare(b.variantId))) {
        await changeStock(tx, {
          storeId,
          variantId: item.variantId,
          delta: item.quantity,
          type: "CANCELAMENTO",
          userId,
          referenceType: "ORDER",
          referenceId: order.id,
          reason: `Cancelamento do pedido #${order.number}`,
          createdAt: options.at,
        });
      }
      if (order.couponId) await releaseCoupon(tx, order.couponId);
      return { number: order.number, status };
    }

    const paid = ORDER_STATUS_FLOW.indexOf(status) >= ORDER_STATUS_FLOW.indexOf("PAGO");
    await tx.order.update({
      where: { id: orderId },
      data: { orderStatus: status, paymentStatus: paid ? "PAID" : "PENDING" },
    });
    await tx.payment.updateMany({ where: { orderId }, data: { status: paid ? "PAID" : "PENDING" } });
    return { number: order.number, status };
  });
}

export async function listOrders(params: {
  storeId: string;
  status?: OrderStatus | null;
  q?: string | null;
  take?: number;
}): Promise<OrderListItem[]> {
  const q = params.q?.trim();
  const number = q && /^#?\d+$/.test(q) ? Number(q.replace("#", "")) : null;
  const rows = await prisma.order.findMany({
    where: {
      storeId: params.storeId,
      ...(params.status ? { orderStatus: params.status } : {}),
      ...(q
        ? {
            OR: [
              ...(number ? [{ number }] : []),
              { customer: { name: { contains: q, mode: "insensitive" as const } } },
              { customer: { email: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: {
      customer: { select: { id: true, name: true } },
      items: {
        select: {
          quantity: true,
          productName: true,
          variantId: true,
          product: {
            select: {
              category: { select: { variantKind: true } },
              images: { select: { url: true, variantId: true, isPrimary: true, position: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: params.take ?? 60,
  });
  return rows.map((o) => ({
    id: o.id,
    number: o.number,
    customerId: o.customer.id,
    customerName: o.customer.name,
    itemThumbs: o.items.slice(0, 3).map((i) => ({
      image: pickImage(i.product.images, i.variantId),
      name: i.productName,
      variantKind: i.product.category.variantKind,
    })),
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    total: toNumber(o.total),
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function countOrdersByStatus(storeId: string) {
  const grouped = await prisma.order.groupBy({
    by: ["orderStatus"],
    where: { storeId },
    _count: { _all: true },
  });
  const out: Partial<Record<OrderStatus, number>> = {};
  for (const g of grouped) out[g.orderStatus] = g._count._all;
  return out;
}

export async function getOrder(storeId: string, id: string) {
  const o = await prisma.order.findFirst({
    where: { id, storeId },
    include: {
      customer: true,
      address: true,
      coupon: { select: { code: true } },
      payments: true,
      items: {
        include: {
          variant: { select: { sku: true, barcode: true, stock: true } },
          product: {
            select: {
              slug: true,
              category: { select: { variantKind: true } },
              images: { select: { url: true, variantId: true, isPrimary: true, position: true } },
            },
          },
        },
      },
    },
  });
  if (!o) return null;
  const movements = await prisma.inventoryMovement.findMany({
    where: { referenceType: "ORDER", referenceId: o.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, type: true, quantity: true, createdAt: true, variantId: true },
  });
  return {
    id: o.id,
    number: o.number,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    shippingMethod: o.shippingMethod,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    notes: o.notes,
    couponCode: o.coupon?.code ?? null,
    subtotal: toNumber(o.subtotal),
    discount: toNumber(o.discount),
    shipping: toNumber(o.shipping),
    total: toNumber(o.total),
    customer: {
      id: o.customer.id,
      name: o.customer.name,
      email: o.customer.email,
      phone: o.customer.phone,
      whatsapp: o.customer.whatsapp,
      cpf: o.customer.cpf,
    },
    address: o.address,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productSlug: i.product.slug,
      variantId: i.variantId,
      productName: i.productName,
      variantLabel: i.variantLabel,
      sku: i.variant.sku,
      currentStock: i.variant.stock,
      variantKind: i.product.category.variantKind,
      image: pickImage(i.product.images, i.variantId),
      quantity: i.quantity,
      unitPrice: toNumber(i.unitPrice),
      subtotal: toNumber(i.subtotal),
    })),
    movements: movements.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  };
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrder>>>;

/** Confirmação pública do pedido (acessível pelo id opaco do pedido). */
export async function getPublicOrder(storeId: string, id: string) {
  const o = await prisma.order.findFirst({
    where: { id, storeId },
    include: {
      customer: { select: { name: true, email: true } },
      address: true,
      items: {
        include: {
          product: {
            select: {
              slug: true,
              category: { select: { variantKind: true } },
              images: { select: { url: true, variantId: true, isPrimary: true, position: true } },
            },
          },
        },
      },
    },
  });
  if (!o) return null;
  return {
    id: o.id,
    number: o.number,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    shippingMethod: o.shippingMethod,
    createdAt: o.createdAt.toISOString(),
    customerName: o.customer.name,
    customerEmail: o.customer.email,
    address: o.address,
    subtotal: toNumber(o.subtotal),
    discount: toNumber(o.discount),
    shipping: toNumber(o.shipping),
    total: toNumber(o.total),
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      productSlug: i.product.slug,
      variantLabel: i.variantLabel,
      variantKind: i.product.category.variantKind,
      image: pickImage(i.product.images, i.variantId),
      quantity: i.quantity,
      unitPrice: toNumber(i.unitPrice),
      subtotal: toNumber(i.subtotal),
    })),
  };
}

export type PublicOrder = NonNullable<Awaited<ReturnType<typeof getPublicOrder>>>;

export async function lookupOrder(storeId: string, email: string, number: number) {
  const o = await prisma.order.findFirst({
    where: { storeId, number, customer: { email: email.trim().toLowerCase() } },
    select: { id: true },
  });
  return o?.id ?? null;
}
