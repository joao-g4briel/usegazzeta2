import { z } from "zod";
import {
  idSchema,
  moneySchema,
  optionalBarcodeSchema,
  optionalMoneySchema,
  optionalText,
  positiveMoneySchema,
  stockQuantitySchema,
  barcodeSchema,
} from "@/lib/validations/common";
import { variantLabel } from "@/lib/variant";

export const PRODUCT_BADGES = [
  "MAIS_VENDIDO",
  "NOVIDADE",
  "OFERTA",
  "TENDENCIA",
  "FAVORITO",
  "ULTIMAS_PECAS",
] as const;

const optionalSku = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v.trim().toUpperCase() : null))
  .pipe(
    z
      .string()
      .min(2, "SKU muito curto.")
      .max(40, "SKU muito longo.")
      .regex(/^[A-Z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou sublinhado.")
      .nullable(),
  );

const hexColor = z
  .string()
  .nullish()
  .transform((v) => (v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null));

export const variantInputSchema = z.object({
  id: z.string().optional().nullable(),
  sku: optionalSku,
  barcode: optionalBarcodeSchema,
  color: optionalText(40),
  colorHex: hexColor,
  size: optionalText(20),
  tone: optionalText(40),
  volume: optionalText(20),
  costPrice: moneySchema,
  salePrice: positiveMoneySchema,
  promotionalPrice: optionalMoneySchema,
  stock: stockQuantitySchema,
  minimumStock: stockQuantitySchema,
  active: z.boolean().default(true),
});

export type VariantInput = z.infer<typeof variantInputSchema>;

export const productImageInputSchema = z.object({
  url: z.string().min(1).max(1000),
  altText: optionalText(160),
});

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do produto.").max(120, "Nome muito longo."),
    categoryId: idSchema,
    description: optionalText(4000),
    brand: optionalText(80),
    basePrice: optionalMoneySchema,
    active: z.boolean().default(true),
    featured: z.boolean().default(false),
    newProduct: z.boolean().default(false),
    onSale: z.boolean().default(false),
    badge: z.enum(PRODUCT_BADGES).nullable().optional(),
    seoTitle: optionalText(70),
    seoDescription: optionalText(170),
    images: z.array(productImageInputSchema).max(12, "Máximo de 12 imagens.").default([]),
    variants: z.array(variantInputSchema).min(1, "Adicione pelo menos uma variante."),
  })
  .superRefine((data, ctx) => {
    const barcodes = new Map<string, number>();
    const skus = new Map<string, number>();
    const combos = new Map<string, number>();
    data.variants.forEach((v, i) => {
      if (v.barcode) {
        if (barcodes.has(v.barcode)) {
          ctx.addIssue({
            code: "custom",
            path: ["variants", i, "barcode"],
            message: "Código de barras repetido em outra variante.",
          });
        }
        barcodes.set(v.barcode, i);
      }
      if (v.sku) {
        if (skus.has(v.sku)) {
          ctx.addIssue({
            code: "custom",
            path: ["variants", i, "sku"],
            message: "SKU repetido em outra variante.",
          });
        }
        skus.set(v.sku, i);
      }
      const key = variantLabel(v).toLowerCase();
      if (combos.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", i, "color"],
          message: `A variante "${variantLabel(v)}" aparece duas vezes.`,
        });
      }
      combos.set(key, i);
      if (v.promotionalPrice !== null && v.promotionalPrice >= v.salePrice) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", i, "promotionalPrice"],
          message: "O preço promocional deve ser menor que o preço de venda.",
        });
      }
    });
  });

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductFormValues = z.input<typeof productInputSchema>;

// Cadastro rápido pelo scanner: cria produto + variante, ou só a variante
// quando o produto já existe.
export const quickRegisterSchema = z
  .object({
    barcode: barcodeSchema,
    existingProductId: z.string().optional().nullable(),
    name: z.string().trim().max(120, "Nome muito longo.").default(""),
    categoryId: idSchema,
    color: optionalText(40),
    size: optionalText(20),
    tone: optionalText(40),
    volume: optionalText(20),
    costPrice: moneySchema,
    salePrice: positiveMoneySchema,
    initialStock: stockQuantitySchema,
    minimumStock: stockQuantitySchema,
    imageUrl: optionalText(1000),
    addToCart: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (!data.existingProductId && data.name.length < 2) {
      ctx.addIssue({ code: "custom", path: ["name"], message: "Informe o nome do produto." });
    }
  });

export type QuickRegisterInput = z.infer<typeof quickRegisterSchema>;
export type QuickRegisterFormValues = z.input<typeof quickRegisterSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria.").max(60),
  description: optionalText(300),
  tagline: optionalText(120),
  variantKind: z.enum(["APPAREL", "BEAUTY", "FRAGRANCE", "ACCESSORY", "OTHER"]),
  position: z.coerce.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
