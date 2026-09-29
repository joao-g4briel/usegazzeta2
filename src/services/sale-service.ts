import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/errors";
import { toCents, toNumber } from "@/lib/money";
import type { FinalizeSaleInput } from "@/lib/validations/sale";
import type { PaymentMethod } from "@/lib/constants";
import { changeStock } from "@/services/inventory-service";
import { consumeCoupon, evaluateCoupon, releaseCoupon, type CouponEvaluation } from "@/services/coupon-service";
import { cents, priceLines, sumCents } from "@/services/pricing-service";
import { resolvePayments } from "@/services/payment-service";
import type { SaleListItem } from "@/types/catalog";

function manualDiscountCents(
  discount: FinalizeSaleInput["discount"],
  subtotalCents: number,
): number {
  if (!discount || discount.value <= 0) return 0;
  if (discount.type === "percent") {
    if (discount.value > 100) throw new DomainError("O desconto máximo é 100%.", "DISCOUNT_TOO_HIGH");
    return Math.round((subtotalCents * discount.value) / 100);
  }
  return toCents(discount.value);
}

export type SaleReceipt = {
  id: string;
  number: number;
  subtotal: number;
  discount: number;
  total: number;
  change: number;
  itemCount: number;
  createdAt: string;
  payments: { method: PaymentMethod; amount: number }[];
};

/**
 * Finaliza a venda presencial numa única transação:
 * confere estoque → cria venda e itens → registra pagamentos →
 * baixa estoque por variante com movimentação VENDA_PDV → consome cupom.
 * Qualquer falha desfaz tudo (sem venda sem baixa, sem baixa sem venda).
 */
export async function finalizeSale(
  storeId: string,
  userId: string | null,
  input: FinalizeSaleInput,
  options: { createdAt?: Date } = {},
): Promise<SaleReceipt> {
  return prisma.$transaction(
    async (tx) => {
      const lines = await priceLines(tx, storeId, input.items);
      const subtotalCents = sumCents(lines);

      const manual = manualDiscountCents(input.discount, subtotalCents);
      let coupon: CouponEvaluation | null = null;
      if (input.couponCode) {
        coupon = await evaluateCoupon(tx, storeId, input.couponCode, subtotalCents, options.createdAt);
      }
      const discountCents = Math.min(subtotalCents, manual + (coupon?.discountCents ?? 0));
      const totalCents = subtotalCents - discountCents;

      const payments = resolvePayments(input.payments, totalCents);

      if (input.customerId) {
        const customer = await tx.customer.findFirst({ where: { id: input.customerId, storeId } });
        if (!customer) throw new DomainError("Cliente não encontrada.", "NOT_FOUND");
      }

      const sale = await tx.sale.create({
        data: {
          storeId,
          userId,
          customerId: input.customerId ?? null,
          couponId: coupon?.couponId ?? null,
          subtotal: cents(subtotalCents),
          discount: cents(discountCents),
          discountReason: input.discountReason ?? (coupon ? `Cupom ${coupon.code}` : null),
          total: cents(totalCents),
          paymentStatus: "PAID",
          status: "COMPLETED",
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
            create: payments.map((p) => ({
              method: p.method,
              amount: cents(p.amountCents),
              receivedAmount: p.receivedCents === null ? null : cents(p.receivedCents),
              changeAmount: p.changeCents === null ? null : cents(p.changeCents),
              installments: p.installments,
              status: "PAID",
              ...(options.createdAt ? { createdAt: options.createdAt } : {}),
            })),
          },
        },
      });

      // Baixa por variante; o UPDATE condicional recusa se outra venda levou a peça antes.
      for (const line of lines) {
        await changeStock(tx, {
          storeId,
          variantId: line.variantId,
          delta: -line.quantity,
          type: "VENDA_PDV",
          userId,
          referenceType: "SALE",
          referenceId: sale.id,
          reason: `Venda PDV #${sale.number}`,
          createdAt: options.createdAt,
        });
      }

      if (coupon) {
        await consumeCoupon(tx, coupon, { saleId: sale.id, customerId: input.customerId });
      }

      return {
        id: sale.id,
        number: sale.number,
        subtotal: subtotalCents / 100,
        discount: discountCents / 100,
        total: totalCents / 100,
        change: payments.reduce((s, p) => s + (p.changeCents ?? 0), 0) / 100,
        itemCount: lines.reduce((s, l) => s + l.quantity, 0),
        createdAt: sale.createdAt.toISOString(),
        payments: payments.map((p) => ({ method: p.method, amount: p.amountCents / 100 })),
      };
    },
    { timeout: 20000 },
  );
}

/** Cancela uma venda presencial e devolve as peças ao estoque. */
export async function cancelSale(storeId: string, userId: string | null, saleId: string, reason: string | null) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id: saleId, storeId },
      include: { items: true },
    });
    if (!sale) throw new DomainError("Venda não encontrada.", "NOT_FOUND");
    if (sale.status === "CANCELED") throw new DomainError("Esta venda já foi cancelada.", "ALREADY_CANCELED");

    const claimed = await tx.sale.updateMany({
      where: { id: saleId, status: "COMPLETED" },
      data: { status: "CANCELED", paymentStatus: "REFUNDED", canceledAt: new Date() },
    });
    if (claimed.count === 0) throw new DomainError("Esta venda já foi cancelada.", "ALREADY_CANCELED");

    await tx.payment.updateMany({ where: { saleId }, data: { status: "REFUNDED" } });

    for (const item of [...sale.items].sort((a, b) => a.variantId.localeCompare(b.variantId))) {
      await changeStock(tx, {
        storeId,
        variantId: item.variantId,
        delta: item.quantity,
        type: "CANCELAMENTO",
        userId,
        referenceType: "SALE",
        referenceId: sale.id,
        reason: reason ? `Cancelamento da venda #${sale.number}: ${reason}` : `Cancelamento da venda #${sale.number}`,
      });
    }
    if (sale.couponId) await releaseCoupon(tx, sale.couponId);
    return { number: sale.number };
  });
}

export async function listSales(params: {
  storeId: string;
  status?: "COMPLETED" | "CANCELED" | null;
  q?: string | null;
  take?: number;
}): Promise<SaleListItem[]> {
  const q = params.q?.trim();
  const number = q && /^\d+$/.test(q.replace("#", "")) ? Number(q.replace("#", "")) : null;
  const rows = await prisma.sale.findMany({
    where: {
      storeId: params.storeId,
      ...(params.status ? { status: params.status } : {}),
      ...(q
        ? {
            OR: [
              ...(number ? [{ number }] : []),
              { customer: { name: { contains: q, mode: "insensitive" as const } } },
              { items: { some: { productName: { contains: q, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    },
    include: {
      customer: { select: { name: true } },
      user: { select: { name: true } },
      items: { select: { quantity: true } },
      payments: { select: { method: true } },
    },
    orderBy: { createdAt: "desc" },
    take: params.take ?? 60,
  });
  return rows.map((s) => ({
    id: s.id,
    number: s.number,
    customerName: s.customer?.name ?? null,
    sellerName: s.user?.name ?? null,
    itemCount: s.items.reduce((n, i) => n + i.quantity, 0),
    total: toNumber(s.total),
    status: s.status,
    methods: [...new Set(s.payments.map((p) => p.method))],
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function getSale(storeId: string, id: string) {
  const s = await prisma.sale.findFirst({
    where: { id, storeId },
    include: {
      customer: { select: { id: true, name: true, whatsapp: true, phone: true } },
      user: { select: { name: true } },
      coupon: { select: { code: true } },
      items: {
        include: {
          variant: { select: { sku: true, barcode: true } },
          product: {
            select: {
              category: { select: { variantKind: true } },
              images: { select: { url: true, isPrimary: true, variantId: true, position: true } },
            },
          },
        },
      },
      payments: true,
    },
  });
  if (!s) return null;
  return {
    id: s.id,
    number: s.number,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    canceledAt: s.canceledAt?.toISOString() ?? null,
    customer: s.customer,
    sellerName: s.user?.name ?? null,
    couponCode: s.coupon?.code ?? null,
    subtotal: toNumber(s.subtotal),
    discount: toNumber(s.discount),
    discountReason: s.discountReason,
    total: toNumber(s.total),
    items: s.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      productName: i.productName,
      variantLabel: i.variantLabel,
      sku: i.variant.sku,
      variantKind: i.product.category.variantKind,
      image:
        i.product.images.find((im) => im.variantId === i.variantId)?.url ??
        i.product.images.find((im) => im.isPrimary)?.url ??
        null,
      quantity: i.quantity,
      unitPrice: toNumber(i.unitPrice),
      subtotal: toNumber(i.subtotal),
    })),
    payments: s.payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: toNumber(p.amount),
      receivedAmount: p.receivedAmount === null ? null : toNumber(p.receivedAmount),
      changeAmount: p.changeAmount === null ? null : toNumber(p.changeAmount),
      installments: p.installments,
      status: p.status,
    })),
  };
}

export type SaleDetail = NonNullable<Awaited<ReturnType<typeof getSale>>>;
