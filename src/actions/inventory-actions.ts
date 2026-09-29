"use server";

import { z } from "zod";
import { runAction, revalidateAll } from "@/lib/action";
import { requireActionUser } from "@/lib/session";
import { stockAdjustmentSchema, stockEntrySchema } from "@/lib/validations/inventory";
import { adjustStock, registerStockEntry } from "@/services/inventory-service";
import { getVariantByBarcode } from "@/services/barcode-service";
import { getPosVariant, searchPosVariants } from "@/services/product-service";

export async function stockEntryAction(values: z.input<typeof stockEntrySchema>) {
  return runAction(async () => {
    const user = await requireActionUser("inventory");
    const input = stockEntrySchema.parse(values);
    const result = await registerStockEntry(user.storeId, user.id, input);
    revalidateAll();
    return result;
  }, "Estoque atualizado");
}

export async function stockAdjustmentAction(values: z.input<typeof stockAdjustmentSchema>) {
  return runAction(async () => {
    const user = await requireActionUser("inventory");
    const input = stockAdjustmentSchema.parse(values);
    const result = await adjustStock(user.storeId, user.id, input);
    revalidateAll();
    return result;
  });
}

// Busca de variantes para telas internas (entrada, ajuste, PDV).
export async function searchVariantsAction(q: string) {
  return runAction(async () => {
    const user = await requireActionUser();
    return searchPosVariants(user.storeId, q, 20);
  });
}

export async function getVariantAction(variantId: string) {
  return runAction(async () => {
    const user = await requireActionUser();
    return getPosVariant(user.storeId, variantId);
  });
}

export async function lookupBarcodeAction(barcode: string) {
  return runAction(async () => {
    const user = await requireActionUser("scanner");
    return getVariantByBarcode(user.storeId, barcode);
  });
}
