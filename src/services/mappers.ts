import { toCents, toNumber, toNumberOrNull } from "@/lib/money";
import { effectivePriceCents, variantDetails, variantLabel } from "@/lib/variant";
import type {
  CategoryDTO,
  PosVariant,
  ProductImageDTO,
  PublicVariantDTO,
  VariantDTO,
} from "@/types/catalog";
import type { VariantKind } from "@/lib/constants";

type DecimalLike = { toString(): string };

export type VariantRecord = {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  tone: string | null;
  volume: string | null;
  costPrice: DecimalLike;
  salePrice: DecimalLike;
  promotionalPrice: DecimalLike | null;
  stock: number;
  minimumStock: number;
  position: number;
  active: boolean;
};

export function priceOf(v: Pick<VariantRecord, "salePrice" | "promotionalPrice">): number {
  const cents = effectivePriceCents(
    toCents(v.salePrice),
    v.promotionalPrice === null ? null : toCents(v.promotionalPrice),
  );
  return cents / 100;
}

export function toPublicVariant(v: VariantRecord): PublicVariantDTO {
  return {
    id: v.id,
    sku: v.sku,
    color: v.color,
    colorHex: v.colorHex,
    size: v.size,
    tone: v.tone,
    volume: v.volume,
    label: variantLabel(v),
    salePrice: toNumber(v.salePrice),
    promotionalPrice: toNumberOrNull(v.promotionalPrice),
    price: priceOf(v),
    stock: Math.max(0, v.stock),
  };
}

export function toVariantDTO(v: VariantRecord): VariantDTO {
  return {
    ...toPublicVariant(v),
    productId: v.productId,
    barcode: v.barcode,
    costPrice: toNumber(v.costPrice),
    minimumStock: v.minimumStock,
    active: v.active,
    position: v.position,
  };
}

export function toImageDTO(i: {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  position: number;
  variantId: string | null;
}): ProductImageDTO {
  return {
    id: i.id,
    url: i.url,
    altText: i.altText,
    isPrimary: i.isPrimary,
    position: i.position,
    variantId: i.variantId,
  };
}

export function toCategoryDTO(c: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  variantKind: VariantKind;
  position: number;
  active: boolean;
  _count?: { products: number };
}): CategoryDTO {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    tagline: c.tagline,
    variantKind: c.variantKind,
    position: c.position,
    active: c.active,
    productCount: c._count?.products,
  };
}

type ImageLite = { url: string; variantId: string | null; isPrimary: boolean; position: number };

// Imagem da variante quando existe; senão, a principal do produto.
export function pickImage(images: ImageLite[], variantId?: string): string | null {
  if (!images.length) return null;
  if (variantId) {
    const own = images.find((i) => i.variantId === variantId);
    if (own) return own.url;
  }
  const sorted = [...images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position,
  );
  return sorted[0]?.url ?? null;
}

export function toPosVariant(
  v: VariantRecord & {
    product: {
      id: string;
      name: string;
      category: { name: string; variantKind: VariantKind };
      images: ImageLite[];
    };
  },
): PosVariant {
  return {
    variantId: v.id,
    productId: v.product.id,
    productName: v.product.name,
    categoryName: v.product.category.name,
    variantKind: v.product.category.variantKind,
    label: variantLabel(v),
    details: variantDetails(v),
    sku: v.sku,
    barcode: v.barcode,
    price: priceOf(v),
    stock: Math.max(0, v.stock),
    image: pickImage(v.product.images, v.id),
    colorHex: v.colorHex,
  };
}

export const posVariantInclude = {
  product: {
    select: {
      id: true,
      name: true,
      category: { select: { name: true, variantKind: true } },
      images: {
        select: { url: true, variantId: true, isPrimary: true, position: true },
        orderBy: { position: "asc" as const },
      },
    },
  },
};
