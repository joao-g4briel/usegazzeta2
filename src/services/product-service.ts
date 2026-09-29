import { Prisma } from "@/generated/prisma/client";
import { prisma, type TransactionClient } from "@/lib/prisma";
import { DomainError, DuplicateBarcodeError } from "@/lib/errors";
import { installmentsFor, toNumber, toNumberOrNull } from "@/lib/money";
import { buildSku, slugify, variantLabel } from "@/lib/variant";
import type { ProductBadge } from "@/lib/constants";
import type {
  CategoryInput,
  ProductInput,
  QuickRegisterInput,
  VariantInput,
} from "@/lib/validations/product";
import { assertBarcodesAvailable } from "@/services/barcode-service";
import { changeStock } from "@/services/inventory-service";
import {
  pickImage,
  posVariantInclude,
  priceOf,
  toCategoryDTO,
  toImageDTO,
  toPosVariant,
  toPublicVariant,
  toVariantDTO,
  type VariantRecord,
} from "@/services/mappers";
import type {
  AdminProductRow,
  CategoryDTO,
  PosVariant,
  ProductEditDTO,
  StoreProductCard,
  StoreProductDetail,
} from "@/types/catalog";

// ─────────────────────────────────────────────── erros de unicidade

function uniqueViolationTarget(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const text = JSON.stringify(error.meta ?? {}) + error.message;
    if (text.includes("barcode")) return "barcode";
    if (text.includes("sku")) return "sku";
    if (text.includes("slug")) return "slug";
    return "unknown";
  }
  return null;
}

function rethrowUnique(error: unknown): never {
  const target = uniqueViolationTarget(error);
  if (target === "barcode") throw new DuplicateBarcodeError();
  if (target === "sku") throw new DomainError("Este SKU já está em uso por outra variante.", "DUPLICATE_SKU", "sku");
  if (target) throw new DomainError("Já existe um registro com estes dados.", "DUPLICATE");
  throw error;
}

// ─────────────────────────────────────────────── categorias

export async function listCategories(storeId: string, onlyActive = false): Promise<CategoryDTO[]> {
  const rows = await prisma.category.findMany({
    where: { storeId, ...(onlyActive ? { active: true } : {}) },
    include: { _count: { select: { products: true } } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  return rows.map(toCategoryDTO);
}

export async function createCategory(storeId: string, input: CategoryInput) {
  const slug = await uniqueCategorySlug(storeId, slugify(input.name));
  return prisma.category.create({ data: { storeId, slug, ...input } });
}

export async function updateCategory(storeId: string, id: string, input: CategoryInput) {
  const existing = await prisma.category.findFirst({ where: { id, storeId } });
  if (!existing) throw new DomainError("Categoria não encontrada.", "NOT_FOUND");
  return prisma.category.update({ where: { id }, data: input });
}

async function uniqueCategorySlug(storeId: string, base: string) {
  let slug = base || "categoria";
  for (let i = 2; await prisma.category.findFirst({ where: { storeId, slug } }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

// ─────────────────────────────────────────────── helpers internos

async function uniqueProductSlug(db: TransactionClient, storeId: string, name: string, excludeId?: string) {
  const base = slugify(name) || "produto";
  let slug = base;
  for (let i = 2; ; i++) {
    const taken = await db.product.findFirst({
      where: { storeId, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!taken) return slug;
    slug = `${base}-${i}`;
  }
}

async function uniqueSku(db: TransactionClient, wanted: string, reserved: Set<string>, excludeId?: string) {
  let sku = wanted;
  for (let i = 2; ; i++) {
    const taken =
      reserved.has(sku) ||
      (await db.productVariant.findFirst({
        where: { sku, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
      }));
    if (!taken) {
      reserved.add(sku);
      return sku;
    }
    sku = `${wanted}-${i}`;
  }
}

function variantData(v: VariantInput) {
  return {
    barcode: v.barcode,
    color: v.color,
    colorHex: v.colorHex,
    size: v.size,
    tone: v.tone,
    volume: v.volume,
    costPrice: v.costPrice.toFixed(2),
    salePrice: v.salePrice.toFixed(2),
    promotionalPrice: v.promotionalPrice === null ? null : v.promotionalPrice.toFixed(2),
    minimumStock: v.minimumStock,
    active: v.active,
  };
}

async function assertCategory(db: TransactionClient, storeId: string, categoryId: string) {
  const category = await db.category.findFirst({ where: { id: categoryId, storeId } });
  if (!category) throw new DomainError("Categoria inválida.", "INVALID_CATEGORY", "categoryId");
  return category;
}

// ─────────────────────────────────────────────── painel: listagem

export async function listAdminProducts(params: {
  storeId: string;
  categorySlug?: string | null;
  q?: string | null;
  status?: "active" | "inactive" | "all";
}): Promise<AdminProductRow[]> {
  const q = params.q?.trim();
  const products = await prisma.product.findMany({
    where: {
      storeId: params.storeId,
      ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
      ...(params.status === "active" ? { active: true } : {}),
      ...(params.status === "inactive" ? { active: false } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { brand: { contains: q, mode: "insensitive" } },
              { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
              { variants: { some: { barcode: { contains: q } } } },
            ],
          }
        : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true, variantKind: true } },
      images: { select: { url: true, variantId: true, isPrimary: true, position: true } },
      variants: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return products.map((p) => {
    const variants = p.variants.map(toVariantDTO);
    const active = variants.filter((v) => v.active);
    const prices = (active.length ? active : variants).map((v) => v.price);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      active: p.active,
      featured: p.featured,
      newProduct: p.newProduct,
      onSale: p.onSale,
      badge: p.badge,
      category: p.category,
      image: pickImage(p.images),
      totalStock: active.reduce((s, v) => s + v.stock, 0),
      priceFrom: prices.length ? Math.min(...prices) : 0,
      priceTo: prices.length ? Math.max(...prices) : 0,
      lowStockCount: active.filter((v) => v.stock > 0 && v.stock <= v.minimumStock).length,
      outOfStockCount: active.filter((v) => v.stock <= 0).length,
      variants,
      createdAt: p.createdAt.toISOString(),
    };
  });
}

export async function countProductsByCategory(storeId: string) {
  const [total, grouped, categories] = await Promise.all([
    prisma.product.count({ where: { storeId } }),
    prisma.product.groupBy({ by: ["categoryId"], where: { storeId }, _count: { _all: true } }),
    prisma.category.findMany({ where: { storeId }, select: { id: true, slug: true } }),
  ]);
  const bySlug: Record<string, number> = {};
  for (const g of grouped) {
    const slug = categories.find((c) => c.id === g.categoryId)?.slug;
    if (slug) bySlug[slug] = g._count._all;
  }
  return { total, bySlug };
}

export async function getProductForEdit(storeId: string, id: string): Promise<ProductEditDTO | null> {
  const p = await prisma.product.findFirst({
    where: { id, storeId },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    categoryId: p.categoryId,
    description: p.description,
    brand: p.brand,
    basePrice: toNumberOrNull(p.basePrice),
    active: p.active,
    featured: p.featured,
    newProduct: p.newProduct,
    onSale: p.onSale,
    badge: p.badge,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    images: p.images.map(toImageDTO),
    variants: p.variants.map(toVariantDTO),
  };
}

// ─────────────────────────────────────────────── painel: criar/editar

function productFields(input: ProductInput) {
  return {
    name: input.name,
    categoryId: input.categoryId,
    description: input.description,
    brand: input.brand,
    basePrice: input.basePrice === null ? null : input.basePrice.toFixed(2),
    active: input.active,
    featured: input.featured,
    newProduct: input.newProduct,
    onSale: input.onSale,
    badge: input.badge ?? null,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  };
}

export async function createProduct(storeId: string, userId: string | null, input: ProductInput) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        await assertCategory(tx, storeId, input.categoryId);
        await assertBarcodesAvailable(tx, input.variants.map((v) => v.barcode ?? ""));

        const product = await tx.product.create({
          data: {
            storeId,
            slug: await uniqueProductSlug(tx, storeId, input.name),
            ...productFields(input),
            images: {
              create: input.images.map((img, i) => ({
                url: img.url,
                altText: img.altText ?? input.name,
                position: i,
                isPrimary: i === 0,
              })),
            },
          },
        });

        const reserved = new Set<string>();
        for (const [i, v] of input.variants.entries()) {
          const sku = await uniqueSku(tx, v.sku ?? buildSku(input.name, v), reserved);
          const variant = await tx.productVariant.create({
            data: { productId: product.id, sku, position: i, stock: 0, ...variantData(v) },
          });
          if (v.stock > 0) {
            await changeStock(tx, {
              storeId,
              variantId: variant.id,
              delta: v.stock,
              type: "ENTRADA",
              userId,
              reason: "Estoque inicial do cadastro",
              unitCost: v.costPrice,
            });
          }
        }
        return product;
      },
      { timeout: 20000 },
    );
  } catch (error) {
    rethrowUnique(error);
  }
}

export async function updateProduct(storeId: string, userId: string | null, id: string, input: ProductInput) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const existing = await tx.product.findFirst({
          where: { id, storeId },
          include: {
            variants: {
              include: {
                _count: { select: { saleItems: true, orderItems: true, inventoryMovements: true } },
              },
            },
          },
        });
        if (!existing) throw new DomainError("Produto não encontrado.", "NOT_FOUND");
        await assertCategory(tx, storeId, input.categoryId);

        const keptIds = input.variants.map((v) => v.id).filter((v): v is string => Boolean(v));
        for (const vid of keptIds) {
          if (!existing.variants.some((v) => v.id === vid)) {
            throw new DomainError("Variante inválida para este produto.");
          }
        }
        await assertBarcodesAvailable(
          tx,
          input.variants.map((v) => v.barcode ?? ""),
          existing.variants.map((v) => v.id),
        );

        await tx.product.update({
          where: { id },
          data: {
            ...productFields(input),
            slug:
              existing.name === input.name
                ? existing.slug
                : await uniqueProductSlug(tx, storeId, input.name, id),
          },
        });

        // Imagens: a ordem enviada é a ordem final; a primeira é a principal.
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (input.images.length) {
          await tx.productImage.createMany({
            data: input.images.map((img, i) => ({
              productId: id,
              url: img.url,
              altText: img.altText ?? input.name,
              position: i,
              isPrimary: i === 0,
            })),
          });
        }

        // Variantes removidas: com histórico viram inativas; sem histórico são apagadas.
        for (const old of existing.variants) {
          if (keptIds.includes(old.id)) continue;
          const hasHistory =
            old._count.saleItems + old._count.orderItems + old._count.inventoryMovements > 0;
          if (hasHistory) {
            await tx.productVariant.update({ where: { id: old.id }, data: { active: false } });
          } else {
            await tx.productVariant.delete({ where: { id: old.id } });
          }
        }

        const reserved = new Set<string>();
        for (const [i, v] of input.variants.entries()) {
          if (v.id) {
            const old = existing.variants.find((o) => o.id === v.id)!;
            const sku = await uniqueSku(tx, v.sku ?? old.sku, reserved, v.id);
            await tx.productVariant.update({
              where: { id: v.id },
              data: { sku, position: i, ...variantData(v) },
            });
            // Estoque editado no cadastro vira um AJUSTE registrado, nunca uma troca silenciosa.
            const current = await tx.productVariant.findUniqueOrThrow({
              where: { id: v.id },
              select: { stock: true },
            });
            const delta = v.stock - current.stock;
            if (delta !== 0) {
              await changeStock(tx, {
                storeId,
                variantId: v.id,
                delta,
                type: "AJUSTE",
                userId,
                reason: "Ajuste pelo cadastro do produto",
              });
            }
          } else {
            const sku = await uniqueSku(tx, v.sku ?? buildSku(input.name, v), reserved);
            const created = await tx.productVariant.create({
              data: { productId: id, sku, position: i, stock: 0, ...variantData(v) },
            });
            if (v.stock > 0) {
              await changeStock(tx, {
                storeId,
                variantId: created.id,
                delta: v.stock,
                type: "ENTRADA",
                userId,
                reason: "Estoque inicial da nova variante",
                unitCost: v.costPrice,
              });
            }
          }
        }
        return { id };
      },
      { timeout: 20000 },
    );
  } catch (error) {
    rethrowUnique(error);
  }
}

export async function setProductActive(storeId: string, id: string, active: boolean) {
  const found = await prisma.product.findFirst({ where: { id, storeId }, select: { id: true } });
  if (!found) throw new DomainError("Produto não encontrado.", "NOT_FOUND");
  return prisma.product.update({ where: { id }, data: { active } });
}

export async function setProductHighlight(
  storeId: string,
  id: string,
  data: { featured?: boolean; badge?: ProductBadge | null },
) {
  const found = await prisma.product.findFirst({ where: { id, storeId }, select: { id: true } });
  if (!found) throw new DomainError("Produto não encontrado.", "NOT_FOUND");
  return prisma.product.update({ where: { id }, data });
}

// ─────────────────────────────────────────────── PDV

export async function searchPosVariants(storeId: string, q: string, limit = 24): Promise<PosVariant[]> {
  const term = q.trim();
  const variants = await prisma.productVariant.findMany({
    where: {
      active: true,
      product: { storeId, active: true },
      ...(term
        ? {
            OR: [
              { product: { name: { contains: term, mode: "insensitive" } } },
              { sku: { contains: term, mode: "insensitive" } },
              { barcode: { startsWith: term } },
              { color: { contains: term, mode: "insensitive" } },
              { tone: { contains: term, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: posVariantInclude,
    orderBy: [{ product: { name: "asc" } }, { position: "asc" }],
    take: limit,
  });
  return variants.map(toPosVariant);
}

export async function getPosVariant(storeId: string, variantId: string): Promise<PosVariant | null> {
  const v = await prisma.productVariant.findFirst({
    where: { id: variantId, product: { storeId } },
    include: posVariantInclude,
  });
  return v ? toPosVariant(v) : null;
}

export async function findProductsByName(storeId: string, q: string, categoryId?: string | null) {
  const term = q.trim();
  if (term.length < 2) return [];
  const rows = await prisma.product.findMany({
    where: {
      storeId,
      name: { contains: term, mode: "insensitive" },
      ...(categoryId ? { categoryId } : {}),
    },
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true, variantKind: true } },
      variants: {
        where: { active: true },
        select: { color: true, size: true, tone: true, volume: true, salePrice: true, costPrice: true, minimumStock: true },
      },
    },
    take: 6,
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    categoryId: p.category.id,
    categoryName: p.category.name,
    variantKind: p.category.variantKind,
    variants: p.variants.map((v) => variantLabel(v)),
    suggestedPrice: p.variants[0] ? toNumber(p.variants[0].salePrice) : null,
    suggestedCost: p.variants[0] ? toNumber(p.variants[0].costPrice) : null,
    suggestedMinimum: p.variants[0]?.minimumStock ?? null,
  }));
}

export type ProductNameMatch = Awaited<ReturnType<typeof findProductsByName>>[number];

/**
 * Cadastro rápido pelo scanner.
 * - Produto já existe (escolhido ou com o mesmo nome) → cria só a variante.
 * - Variante com os mesmos atributos já existe sem código → recebe o código.
 * - Senão cria produto + variante. Sempre registra a entrada inicial.
 */
export async function quickRegister(storeId: string, userId: string | null, input: QuickRegisterInput) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        await assertBarcodesAvailable(tx, [input.barcode]);
        const category = await assertCategory(tx, storeId, input.categoryId);

        let product = input.existingProductId
          ? await tx.product.findFirst({ where: { id: input.existingProductId, storeId } })
          : await tx.product.findFirst({
              where: { storeId, name: { equals: input.name, mode: "insensitive" } },
            });
        if (input.existingProductId && !product) {
          throw new DomainError("Produto escolhido não foi encontrado.", "NOT_FOUND");
        }

        let createdProduct = false;
        if (!product) {
          product = await tx.product.create({
            data: {
              storeId,
              categoryId: category.id,
              name: input.name,
              slug: await uniqueProductSlug(tx, storeId, input.name),
              newProduct: true,
            },
          });
          createdProduct = true;
        }

        const attrs = { color: input.color, size: input.size, tone: input.tone, volume: input.volume };
        const label = variantLabel(attrs).toLowerCase();
        const siblings = await tx.productVariant.findMany({ where: { productId: product.id } });
        const same = siblings.find((s) => variantLabel(s).toLowerCase() === label);
        if (same?.barcode) {
          throw new DomainError(
            `A variante "${variantLabel(same)}" já existe com o código ${same.barcode}.`,
            "VARIANT_EXISTS",
          );
        }

        let variantId: string;
        let createdVariant = false;
        if (same) {
          await tx.productVariant.update({
            where: { id: same.id },
            data: {
              barcode: input.barcode,
              active: true,
              salePrice: input.salePrice.toFixed(2),
              costPrice: input.costPrice.toFixed(2),
              minimumStock: input.minimumStock,
            },
          });
          variantId = same.id;
        } else {
          const sku = await uniqueSku(tx, buildSku(product.name, attrs), new Set());
          const created = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku,
              barcode: input.barcode,
              ...attrs,
              costPrice: input.costPrice.toFixed(2),
              salePrice: input.salePrice.toFixed(2),
              minimumStock: input.minimumStock,
              position: siblings.length,
              stock: 0,
            },
          });
          variantId = created.id;
          createdVariant = true;
        }

        if (input.initialStock > 0) {
          await changeStock(tx, {
            storeId,
            variantId,
            delta: input.initialStock,
            type: "ENTRADA",
            userId,
            reason: "Cadastro rápido pelo scanner",
            unitCost: input.costPrice,
          });
        }

        if (input.imageUrl) {
          const imageCount = await tx.productImage.count({ where: { productId: product.id } });
          await tx.productImage.create({
            data: {
              productId: product.id,
              variantId,
              url: input.imageUrl,
              altText: `${product.name} ${variantLabel(attrs)}`,
              position: imageCount,
              isPrimary: imageCount === 0,
            },
          });
        }

        const full = await tx.productVariant.findUniqueOrThrow({
          where: { id: variantId },
          include: posVariantInclude,
        });
        return { createdProduct, createdVariant, variant: toPosVariant(full) };
      },
      { timeout: 20000 },
    );
  } catch (error) {
    rethrowUnique(error);
  }
}

// ─────────────────────────────────────────────── loja pública

type StoreSettingsLite = { maxInstallments: number; minInstallmentValue: { toString(): string } };

const storeProductInclude = {
  category: { select: { name: true, slug: true, variantKind: true } },
  images: { orderBy: { position: "asc" as const } },
  variants: {
    where: { active: true },
    orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }],
  },
};

type StoreProductRecord = Prisma.ProductGetPayload<{ include: typeof storeProductInclude }>;

function computeBadge(p: StoreProductRecord, totalStock: number, hasPromo: boolean): ProductBadge | null {
  if (p.badge) return p.badge;
  if (p.onSale || hasPromo) return "OFERTA";
  if (p.newProduct) return "NOVIDADE";
  if (totalStock > 0 && totalStock <= 3) return "ULTIMAS_PECAS";
  return null;
}

function toStoreCard(p: StoreProductRecord, settings: StoreSettingsLite): StoreProductCard {
  const variants = p.variants as VariantRecord[];
  const inStock = variants.filter((v) => v.stock > 0);
  const pool = inStock.length ? inStock : variants;
  const cheapest = pool.reduce<VariantRecord | null>(
    (best, v) => (!best || priceOf(v) < priceOf(best) ? v : best),
    null,
  );
  const price = cheapest ? priceOf(cheapest) : 0;
  const compareAt =
    cheapest && toNumber(cheapest.salePrice) > price ? toNumber(cheapest.salePrice) : null;
  const totalStock = variants.reduce((s, v) => s + Math.max(0, v.stock), 0);
  const hasPromo = variants.some((v) => priceOf(v) < toNumber(v.salePrice));

  const seen = new Set<string>();
  const swatches: { color: string; hex: string | null }[] = [];
  for (const v of variants) {
    if (v.color && !seen.has(v.color.toLowerCase())) {
      seen.add(v.color.toLowerCase());
      swatches.push({ color: v.color, hex: v.colorHex });
    }
  }
  const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    categoryName: p.category.name,
    categorySlug: p.category.slug,
    variantKind: p.category.variantKind,
    image: primary?.url ?? null,
    imageAlt: primary?.altText ?? p.name,
    price,
    compareAtPrice: compareAt,
    badge: computeBadge(p, totalStock, hasPromo),
    totalStock,
    available: totalStock > 0,
    swatches,
    installments: installmentsFor(price, settings.maxInstallments, toNumber(settings.minInstallmentValue)),
    singleVariantId: variants.length === 1 ? variants[0].id : null,
    variants: variants.map(toPublicVariant),
  };
}

export type StoreListingFilter = "novidades" | "ofertas" | "looks" | null;
export type StoreListingSort = "relevancia" | "menor-preco" | "maior-preco" | "novidades";

export async function listStoreProducts(params: {
  storeId: string;
  settings: StoreSettingsLite;
  categorySlug?: string | null;
  q?: string | null;
  filter?: StoreListingFilter;
  sort?: StoreListingSort;
  featuredOnly?: boolean;
  take?: number;
}): Promise<StoreProductCard[]> {
  const q = params.q?.trim();
  const since = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
  const where: Prisma.ProductWhereInput = {
    storeId: params.storeId,
    active: true,
    category: { active: true, ...(params.categorySlug ? { slug: params.categorySlug } : {}) },
    variants: { some: { active: true } },
    ...(params.featuredOnly ? { featured: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  if (params.filter === "novidades") {
    where.AND = [{ OR: [{ newProduct: true }, { createdAt: { gte: since } }] }];
  } else if (params.filter === "ofertas") {
    where.AND = [
      { OR: [{ onSale: true }, { variants: { some: { active: true, promotionalPrice: { not: null } } } }] },
    ];
  } else if (params.filter === "looks") {
    where.AND = [{ category: { variantKind: "APPAREL" } }];
  }

  const products = await prisma.product.findMany({
    where,
    include: storeProductInclude,
    orderBy:
      params.sort === "novidades"
        ? [{ createdAt: "desc" }]
        : [{ featured: "desc" }, { createdAt: "desc" }],
    take: params.take,
  });

  const cards = products.map((p) => toStoreCard(p, params.settings));
  // Disponíveis primeiro; esgotados continuam visíveis no fim.
  const sort = params.sort ?? "relevancia";
  cards.sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    if (sort === "menor-preco") return a.price - b.price;
    if (sort === "maior-preco") return b.price - a.price;
    return 0;
  });
  return cards;
}

export async function getStoreProductBySlug(
  storeId: string,
  settings: StoreSettingsLite,
  slug: string,
): Promise<StoreProductDetail | null> {
  const p = await prisma.product.findFirst({
    where: { storeId, slug, active: true },
    include: storeProductInclude,
  });
  if (!p || !p.variants.length) return null;
  const card = toStoreCard(p, settings);
  return {
    ...card,
    description: p.description,
    brand: p.brand,
    images: p.images.map(toImageDTO),
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

export async function listRelatedProducts(
  storeId: string,
  settings: StoreSettingsLite,
  product: { id: string; categorySlug: string },
  take = 4,
) {
  const products = await prisma.product.findMany({
    where: {
      storeId,
      active: true,
      id: { not: product.id },
      category: { slug: product.categorySlug },
      variants: { some: { active: true, stock: { gt: 0 } } },
    },
    include: storeProductInclude,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take,
  });
  return products.map((p) => toStoreCard(p, settings));
}

export async function listStoreSlugs(storeId: string) {
  return prisma.product.findMany({
    where: { storeId, active: true },
    select: { slug: true, updatedAt: true },
  });
}
