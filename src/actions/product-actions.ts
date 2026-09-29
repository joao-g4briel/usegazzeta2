"use server";

import { runAction, revalidateAll } from "@/lib/action";
import { requireActionUser } from "@/lib/session";
import {
  categoryInputSchema,
  productInputSchema,
  quickRegisterSchema,
  PRODUCT_BADGES,
  type ProductFormValues,
  type QuickRegisterFormValues,
} from "@/lib/validations/product";
import {
  createCategory,
  createProduct,
  findProductsByName,
  quickRegister,
  setProductActive,
  setProductHighlight,
  updateCategory,
  updateProduct,
} from "@/services/product-service";
import { isBarcodeAvailable } from "@/services/barcode-service";
import { z } from "zod";

export async function saveProductAction(values: ProductFormValues, productId?: string) {
  return runAction(async () => {
    const user = await requireActionUser("products");
    const input = productInputSchema.parse(values);
    const result = productId
      ? await updateProduct(user.storeId, user.id, productId, input)
      : await createProduct(user.storeId, user.id, input);
    revalidateAll();
    return { id: result.id };
  }, productId ? "Produto atualizado com sucesso" : "Produto cadastrado com sucesso");
}

export async function setProductActiveAction(productId: string, active: boolean) {
  return runAction(async () => {
    const user = await requireActionUser("products");
    await setProductActive(user.storeId, productId, active);
    revalidateAll();
    return { active };
  }, active ? "Produto reativado" : "Produto arquivado");
}

const highlightSchema = z.object({
  productId: z.string().min(1),
  featured: z.boolean().optional(),
  badge: z.enum(PRODUCT_BADGES).nullable().optional(),
});

export async function setProductHighlightAction(values: z.input<typeof highlightSchema>) {
  return runAction(async () => {
    const user = await requireActionUser("marketing");
    const input = highlightSchema.parse(values);
    await setProductHighlight(user.storeId, input.productId, {
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.badge !== undefined ? { badge: input.badge } : {}),
    });
    revalidateAll();
    return null;
  }, "Destaque atualizado");
}

export async function checkBarcodeAction(barcode: string, excludeVariantId?: string) {
  return runAction(async () => {
    await requireActionUser();
    return isBarcodeAvailable(barcode, excludeVariantId);
  });
}

export async function searchProductsByNameAction(q: string, categoryId?: string | null) {
  return runAction(async () => {
    const user = await requireActionUser();
    return findProductsByName(user.storeId, q, categoryId);
  });
}

// Cadastro rápido pelo scanner: vendedora (PDV/scanner) e estoque podem usar.
export async function quickRegisterAction(values: QuickRegisterFormValues) {
  return runAction(async () => {
    const user = await requireActionUser("scanner");
    const input = quickRegisterSchema.parse(values);
    const result = await quickRegister(user.storeId, user.id, input);
    revalidateAll();
    return result;
  });
}

export async function saveCategoryAction(values: z.input<typeof categoryInputSchema>, id?: string) {
  return runAction(async () => {
    const user = await requireActionUser("categories");
    const input = categoryInputSchema.parse(values);
    const category = id
      ? await updateCategory(user.storeId, id, input)
      : await createCategory(user.storeId, input);
    revalidateAll();
    return { id: category.id };
  }, id ? "Categoria atualizada" : "Categoria criada");
}
