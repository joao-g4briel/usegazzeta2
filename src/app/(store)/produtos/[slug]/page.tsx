import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Store, Truck } from "lucide-react";
import { ProductGallery } from "@/components/store/product-gallery";
import { PurchasePanel } from "@/components/store/purchase-panel";
import { ProductCard, ProductBadge } from "@/components/store/product-card";
import { FavoriteButton } from "@/components/store/product-card-actions";
import { SectionTitle } from "@/components/shared/misc";
import { formatBRL } from "@/lib/money";
import { swatchFor } from "@/lib/constants";
import { getPublicStore } from "@/services/store-service";
import { getStoreProductBySlug, listRelatedProducts } from "@/services/product-service";

export async function generateMetadata({ params }: PageProps<"/produtos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStore();
  const product = await getStoreProductBySlug(store.id, store, slug);
  if (!product) return { title: "Produto não encontrado" };
  const description =
    product.seoDescription ?? product.description?.slice(0, 160) ?? `${product.name} na Use Gazzeta.`;
  return {
    title: product.seoTitle ?? product.name,
    description,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/produtos/[slug]">) {
  const { slug } = await params;
  const store = await getPublicStore();
  const product = await getStoreProductBySlug(store.id, store, slug);
  if (!product) notFound();
  const related = await listRelatedProducts(store.id, store, product, 4);
  const tint = product.swatches[0] ? swatchFor(product.swatches[0].color, product.swatches[0].hex) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    brand: { "@type": "Brand", name: product.brand ?? store.name },
    category: product.categoryName,
    image: product.images.map((i) => i.url),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: `${product.name} ${v.label}`,
      price: v.price.toFixed(2),
      priceCurrency: "BRL",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `/produtos/${product.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-6 pb-20 sm:px-6 sm:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Caminho" className="mb-6 flex items-center gap-1.5 text-sm text-stone-ink">
        <Link href="/" className="hover:text-olive">Início</Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/categoria/${product.categorySlug}`} className="hover:text-olive">
          {product.categoryName}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="relative lg:sticky lg:top-36 lg:self-start">
          <ProductGallery images={product.images} name={product.name} kind={product.variantKind} tint={tint} />
          <ProductBadge badge={product.available ? product.badge : null} className="absolute top-4 left-4" />
          <FavoriteButton slug={product.slug} name={product.name} className="absolute top-4 right-4" />
        </div>

        <div className="flex flex-col gap-7">
          <div className="space-y-2">
            <h1 className="font-serif text-[2.5rem] leading-[1.02] font-medium text-ink sm:text-[3.2rem]">
              {product.name}
            </h1>
            <p className="text-sm text-stone-ink">
              {product.categoryName}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>
          </div>

          <PurchasePanel
            product={product}
            maxInstallments={store.maxInstallments}
            minInstallmentValue={store.minInstallmentValue}
          />

          <div className="divide-y divide-hairline border-y border-hairline">
            {product.description ? (
              <details open className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-xl font-semibold">
                  Descrição
                  <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 leading-relaxed text-stone-ink">{product.description}</p>
              </details>
            ) : null}
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-xl font-semibold">
                Entrega e retirada
                <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
              </summary>
              <ul className="mt-3 space-y-3 text-sm text-stone-ink">
                <li className="flex gap-3">
                  <Truck className="mt-0.5 size-4 shrink-0 text-olive" />
                  <span>
                    Enviamos para todo o Brasil. Frete de {formatBRL(store.shippingFlatRate)}
                    {store.freeShippingThreshold !== null
                      ? `, grátis em compras a partir de ${formatBRL(store.freeShippingThreshold)}`
                      : ""}
                    .
                  </span>
                </li>
                <li className="flex gap-3">
                  <Store className="mt-0.5 size-4 shrink-0 text-olive" />
                  <span>Retirada na loja sem custo — escolha no checkout.</span>
                </li>
              </ul>
            </details>
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="mt-20">
          <SectionTitle>Combina com você</SectionTitle>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
