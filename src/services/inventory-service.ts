import { prisma, type TransactionClient } from "@/lib/prisma";
import { DomainError, InsufficientStockError } from "@/lib/errors";
import { variantLabel } from "@/lib/variant";
import { toNumberOrNull } from "@/lib/money";
import { ADJUSTMENT_REASONS, type InventoryMovementType } from "@/lib/constants";
import type { StockAdjustmentInput, StockEntryInput } from "@/lib/validations/inventory";
import type { MovementDTO } from "@/types/catalog";
import { toVariantDTO } from "@/services/mappers";

type ChangeStockParams = {
  storeId: string;
  variantId: string;
  delta: number;
  type: InventoryMovementType;
  userId?: string | null;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  unitCost?: number | null;
  supplier?: string | null;
  createdAt?: Date;
};

/**
 * Única porta de alteração de estoque. Deve rodar dentro de uma transação.
 * - Saída usa UPDATE condicional (stock >= quantidade): duas vendas simultâneas
 *   da última unidade nunca deixam o estoque negativo; a segunda falha e faz rollback.
 * - Sempre grava a movimentação com estoque anterior e posterior.
 */
export async function changeStock(tx: TransactionClient, params: ChangeStockParams) {
  const { storeId, variantId, delta } = params;
  if (!Number.isInteger(delta) || delta === 0) {
    throw new DomainError("Quantidade de movimentação inválida.");
  }

  if (delta < 0) {
    const updated = await tx.productVariant.updateMany({
      where: { id: variantId, product: { storeId }, stock: { gte: -delta } },
      data: { stock: { decrement: -delta } },
    });
    if (updated.count === 0) {
      const current = await tx.productVariant.findFirst({
        where: { id: variantId, product: { storeId } },
        select: {
          id: true,
          stock: true,
          color: true,
          size: true,
          tone: true,
          volume: true,
          product: { select: { name: true } },
        },
      });
      if (!current) throw new DomainError("Variante não encontrada.", "NOT_FOUND");
      throw new InsufficientStockError(
        `${current.product.name} (${variantLabel(current)})`,
        current.id,
        current.stock,
      );
    }
  } else {
    const updated = await tx.productVariant.updateMany({
      where: { id: variantId, product: { storeId } },
      data: { stock: { increment: delta } },
    });
    if (updated.count === 0) throw new DomainError("Variante não encontrada.", "NOT_FOUND");
  }

  // A linha está travada pela atualização acima até o fim da transação.
  const after = await tx.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    select: { stock: true, productId: true },
  });

  const movement = await tx.inventoryMovement.create({
    data: {
      storeId,
      productId: after.productId,
      variantId,
      userId: params.userId ?? null,
      type: params.type,
      quantity: delta,
      stockBefore: after.stock - delta,
      stockAfter: after.stock,
      unitCost: params.unitCost ?? null,
      supplier: params.supplier ?? null,
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      reason: params.reason ?? null,
      ...(params.createdAt ? { createdAt: params.createdAt } : {}),
    },
  });

  return { stockBefore: movement.stockBefore, stockAfter: movement.stockAfter, movementId: movement.id };
}

// Trava a linha e devolve o estoque atual (para contagem de inventário).
async function lockVariantStock(tx: TransactionClient, storeId: string, variantId: string) {
  const rows = await tx.$queryRaw<{ stock: number }[]>`
    SELECT v.stock FROM product_variants v
    JOIN products p ON p.id = v.product_id
    WHERE v.id = ${variantId} AND p.store_id = ${storeId}
    FOR UPDATE OF v`;
  if (!rows.length) throw new DomainError("Variante não encontrada.", "NOT_FOUND");
  return Number(rows[0].stock);
}

export async function registerStockEntry(storeId: string, userId: string, input: StockEntryInput) {
  return prisma.$transaction(async (tx) => {
    const result = await changeStock(tx, {
      storeId,
      variantId: input.variantId,
      delta: input.quantity,
      type: "ENTRADA",
      userId,
      unitCost: input.unitCost,
      supplier: input.supplier,
      reason: input.note ?? "Entrada de mercadoria",
    });
    if (input.unitCost !== null && input.unitCost > 0) {
      await tx.productVariant.update({
        where: { id: input.variantId },
        data: { costPrice: input.unitCost.toFixed(2) },
      });
    }
    return result;
  });
}

function adjustmentTypeFor(input: StockAdjustmentInput, delta: number): InventoryMovementType {
  if ((input.reason === "PERDA" || input.reason === "AVARIA") && delta < 0) return "PERDA";
  if (input.reason === "DEVOLUCAO" && delta > 0) return "DEVOLUCAO";
  return "AJUSTE";
}

export async function adjustStock(storeId: string, userId: string, input: StockAdjustmentInput) {
  return prisma.$transaction(async (tx) => {
    let delta: number;
    if (input.mode === "set") {
      const current = await lockVariantStock(tx, storeId, input.variantId);
      delta = input.quantity - current;
      if (delta === 0) {
        return { changed: false as const, stockAfter: current };
      }
    } else {
      delta = input.mode === "add" ? input.quantity : -input.quantity;
    }
    const reasonLabel =
      ADJUSTMENT_REASONS.find((r) => r.value === input.reason)?.label ?? input.reason;
    const result = await changeStock(tx, {
      storeId,
      variantId: input.variantId,
      delta,
      type: adjustmentTypeFor(input, delta),
      userId,
      reason: input.note ? `${reasonLabel}: ${input.note}` : reasonLabel,
    });
    return { changed: true as const, stockAfter: result.stockAfter };
  });
}

export type StockFilter = "all" | "normal" | "low" | "out";

export async function getStockOverview(params: {
  storeId: string;
  filter?: StockFilter;
  categorySlug?: string | null;
  q?: string | null;
}) {
  const q = params.q?.trim();
  const products = await prisma.product.findMany({
    where: {
      storeId: params.storeId,
      active: true,
      ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
              { variants: { some: { barcode: { contains: q } } } },
              { variants: { some: { color: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true, variantKind: true } },
      images: { select: { url: true, variantId: true, isPrimary: true, position: true }, orderBy: { position: "asc" } },
      variants: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
    },
    orderBy: { name: "asc" },
  });

  const filter = params.filter ?? "all";
  const groups = products
    .map((p) => {
      const variants = p.variants.map(toVariantDTO);
      const active = variants.filter((v) => v.active);
      const totalStock = active.reduce((s, v) => s + v.stock, 0);
      const lowCount = active.filter((v) => v.stock > 0 && v.stock <= v.minimumStock).length;
      const outCount = active.filter((v) => v.stock <= 0).length;
      const image =
        p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null;
      return {
        id: p.id,
        name: p.name,
        active: p.active,
        category: p.category,
        image,
        totalStock,
        lowCount,
        outCount,
        variants,
      };
    })
    .filter((g) => {
      if (filter === "low") return g.lowCount > 0;
      if (filter === "out") return g.outCount > 0;
      if (filter === "normal") return g.lowCount === 0 && g.outCount === 0;
      return true;
    });

  return groups;
}

export type StockGroup = Awaited<ReturnType<typeof getStockOverview>>[number];

export async function getStockCounts(storeId: string) {
  const [variants, low, out] = await Promise.all([
    prisma.productVariant.count({ where: { active: true, product: { storeId } } }),
    prisma.productVariant.count({
      where: {
        active: true,
        product: { storeId },
        stock: { gt: 0, lte: prisma.productVariant.fields.minimumStock },
      },
    }),
    prisma.productVariant.count({ where: { active: true, product: { storeId }, stock: { lte: 0 } } }),
  ]);
  return { variants, low, out, normal: variants - low - out };
}

export async function listLowStockVariants(storeId: string, limit = 8) {
  const variants = await prisma.productVariant.findMany({
    where: {
      active: true,
      product: { storeId, active: true },
      stock: { lte: prisma.productVariant.fields.minimumStock },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          images: { select: { url: true, variantId: true, isPrimary: true, position: true } },
          category: { select: { variantKind: true, name: true } },
        },
      },
    },
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
    take: limit,
  });
  return variants.map((v) => ({
    variantId: v.id,
    productId: v.product.id,
    productName: v.product.name,
    variantKind: v.product.category.variantKind,
    label: variantLabel(v, " • "),
    sku: v.sku,
    stock: v.stock,
    minimumStock: v.minimumStock,
    image:
      v.product.images.find((i) => i.variantId === v.id)?.url ??
      v.product.images.find((i) => i.isPrimary)?.url ??
      v.product.images[0]?.url ??
      null,
  }));
}

const REFERENCE_LABELS: Record<string, string> = {
  SALE: "Venda",
  ORDER: "Pedido",
};

export async function listMovements(params: {
  storeId: string;
  variantId?: string | null;
  productId?: string | null;
  type?: InventoryMovementType | null;
  take?: number;
  skip?: number;
}): Promise<{ items: MovementDTO[]; total: number }> {
  const where = {
    storeId: params.storeId,
    ...(params.variantId ? { variantId: params.variantId } : {}),
    ...(params.productId ? { productId: params.productId } : {}),
    ...(params.type ? { type: params.type } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } },
        variant: { select: { color: true, size: true, tone: true, volume: true } },
      },
      orderBy: { createdAt: "desc" },
      take: params.take ?? 50,
      skip: params.skip ?? 0,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  // Números legíveis de venda/pedido para a coluna "referência".
  const saleIds = rows.filter((r) => r.referenceType === "SALE" && r.referenceId).map((r) => r.referenceId!);
  const orderIds = rows.filter((r) => r.referenceType === "ORDER" && r.referenceId).map((r) => r.referenceId!);
  const [sales, orders] = await Promise.all([
    saleIds.length
      ? prisma.sale.findMany({ where: { id: { in: saleIds } }, select: { id: true, number: true } })
      : [],
    orderIds.length
      ? prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, number: true } })
      : [],
  ]);
  const numbers = new Map<string, number>();
  for (const s of sales) numbers.set(s.id, s.number);
  for (const o of orders) numbers.set(o.id, o.number);

  return {
    total,
    items: rows.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      stockBefore: m.stockBefore,
      stockAfter: m.stockAfter,
      reason: m.reason,
      supplier: m.supplier,
      unitCost: toNumberOrNull(m.unitCost),
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      referenceLabel:
        m.referenceType && m.referenceId && numbers.has(m.referenceId)
          ? `${REFERENCE_LABELS[m.referenceType] ?? m.referenceType} #${numbers.get(m.referenceId)}`
          : null,
      createdAt: m.createdAt.toISOString(),
      userName: m.user?.name ?? null,
      productId: m.productId,
      productName: m.product.name,
      variantId: m.variantId,
      variantLabel: variantLabel(m.variant),
    })),
  };
}
