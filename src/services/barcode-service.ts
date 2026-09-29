import { prisma, type TransactionClient } from "@/lib/prisma";
import { checkBarcode } from "@/lib/barcode";
import { DomainError, DuplicateBarcodeError } from "@/lib/errors";
import { posVariantInclude, toPosVariant } from "@/services/mappers";
import type { PosVariant } from "@/types/catalog";

export type BarcodeLookup =
  | { status: "found"; variant: PosVariant; active: boolean }
  | { status: "not_found"; barcode: string };

/**
 * barcode → variant. Nunca identifica item pelo product_id:
 * o código pertence à variante (ex.: Vestido Frente Única, Amarelo / M).
 */
export async function getVariantByBarcode(storeId: string, raw: string): Promise<BarcodeLookup> {
  const check = checkBarcode(raw);
  if (!check.valid) throw new DomainError(check.message, "INVALID_BARCODE", "barcode");

  const variant = await prisma.productVariant.findFirst({
    where: { barcode: check.value, product: { storeId } },
    include: posVariantInclude,
  });

  if (!variant) return { status: "not_found", barcode: check.value };
  return { status: "found", variant: toPosVariant(variant), active: variant.active };
}

// Verificação antes de salvar: o código é único no catálogo inteiro.
export async function assertBarcodesAvailable(
  db: TransactionClient | typeof prisma,
  barcodes: string[],
  excludeVariantIds: string[] = [],
) {
  const unique = [...new Set(barcodes.filter(Boolean))];
  if (!unique.length) return;
  const taken = await db.productVariant.findFirst({
    where: {
      barcode: { in: unique },
      ...(excludeVariantIds.length ? { id: { notIn: excludeVariantIds } } : {}),
    },
    select: { barcode: true },
  });
  if (taken) throw new DuplicateBarcodeError();
}

export async function isBarcodeAvailable(raw: string, excludeVariantId?: string) {
  const check = checkBarcode(raw);
  if (!check.valid) return { available: false, message: check.message };
  const taken = await prisma.productVariant.findFirst({
    where: {
      barcode: check.value,
      ...(excludeVariantId ? { id: { not: excludeVariantId } } : {}),
    },
    select: { id: true, product: { select: { name: true } } },
  });
  if (taken) {
    return { available: false, message: "Este código de barras já pertence a outro produto." };
  }
  return { available: true, message: null };
}
