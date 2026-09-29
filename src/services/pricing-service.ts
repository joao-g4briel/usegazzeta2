import { prisma, type TransactionClient } from "@/lib/prisma";
import { DomainError, InsufficientStockError } from "@/lib/errors";
import { toCents } from "@/lib/money";
import { effectivePriceCents, variantLabel } from "@/lib/variant";

type Db = TransactionClient | typeof prisma;

export type PricedLine = {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPriceCents: number;
  costCents: number;
  subtotalCents: number;
  availableStock: number;
};

/** Junta linhas repetidas da mesma variante e ordena por id (evita deadlock entre transações). */
export function mergeItems(items: { variantId: string; quantity: number }[]) {
  const map = new Map<string, number>();
  for (const item of items) map.set(item.variantId, (map.get(item.variantId) ?? 0) + item.quantity);
  return [...map.entries()]
    .map(([variantId, quantity]) => ({ variantId, quantity }))
    .sort((a, b) => a.variantId.localeCompare(b.variantId));
}

/**
 * Preço e custo SEMPRE vêm do banco, nunca do navegador.
 * Também confere se a variante está ativa e (opcionalmente) se há estoque.
 */
export async function priceLines(
  db: Db,
  storeId: string,
  items: { variantId: string; quantity: number }[],
  options: { checkStock?: boolean } = {},
): Promise<PricedLine[]> {
  const merged = mergeItems(items);
  const variants = await db.productVariant.findMany({
    where: { id: { in: merged.map((i) => i.variantId) }, product: { storeId } },
    include: { product: { select: { id: true, name: true, active: true } } },
  });

  return merged.map((item) => {
    const v = variants.find((x) => x.id === item.variantId);
    if (!v) throw new DomainError("Um dos itens não existe mais no catálogo.", "NOT_FOUND");
    const label = variantLabel(v);
    if (!v.active || !v.product.active) {
      throw new DomainError(`${v.product.name} (${label}) não está disponível para venda.`, "INACTIVE");
    }
    if (options.checkStock !== false && v.stock < item.quantity) {
      throw new InsufficientStockError(`${v.product.name} (${label})`, v.id, v.stock);
    }
    const unit = effectivePriceCents(
      toCents(v.salePrice),
      v.promotionalPrice === null ? null : toCents(v.promotionalPrice),
    );
    return {
      variantId: v.id,
      productId: v.product.id,
      productName: v.product.name,
      variantLabel: label,
      quantity: item.quantity,
      unitPriceCents: unit,
      costCents: toCents(v.costPrice),
      subtotalCents: unit * item.quantity,
      availableStock: v.stock,
    };
  });
}

export function sumCents(lines: { subtotalCents: number }[]) {
  return lines.reduce((s, l) => s + l.subtotalCents, 0);
}

export function cents(value: number) {
  return (value / 100).toFixed(2);
}
