import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/store/hero";
import { CategoryCard } from "@/components/store/category-card";
import { ProductCard } from "@/components/store/product-card";
import { SectionTitle } from "@/components/shared/misc";
import { getPublicStore } from "@/services/store-service";
import { listCategories, listStoreProducts } from "@/services/product-service";
import type { StoreProductCard } from "@/types/catalog";

const HOME_CATEGORIES = [
  { slug: "roupas", cta: "Ver coleção", fallback: "Looks para todas as ocasiões", tint: "#F2DF8C" },
  { slug: "maquiagens", cta: "Ver maquiagens", fallback: "Realce o que te faz única", tint: "#C9787A" },
  { slug: "perfumes", cta: "Ver perfumes", fallback: "Fragrâncias que deixam a sua marca", tint: "#F3D9CF" },
] as const;

function pickTrio(cards: StoreProductCard[]) {
  const byKind = (kind: StoreProductCard["variantKind"]) => cards.find((c) => c.variantKind === kind && c.available);
  const trio = [byKind("FRAGRANCE"), byKind("APPAREL"), byKind("BEAUTY")].filter(
    (c): c is StoreProductCard => Boolean(c),
  );
  for (const c of cards) if (trio.length < 3 && !trio.includes(c)) trio.push(c);
  return trio;
}

export default async function HomePage() {
  const store = await getPublicStore();
  const [featured, categories, newest] = await Promise.all([
    listStoreProducts({ storeId: store.id, settings: store, featuredOnly: true, take: 12 }),
    listCategories(store.id, true),
    listStoreProducts({ storeId: store.id, settings: store, sort: "novidades", take: 12 }),
  ]);
  const highlights = featured.length >= 6 ? featured.slice(0, 6) : featured;
  // Mais recentes fora dos destaques, sempre uma fileira completa.
  const fresh = newest.filter((p) => p.available && !highlights.some((h) => h.id === p.id)).slice(0, 4);

  return (
    <>
      <Hero trio={pickTrio(featured)} heroImageUrl={store.heroImageUrl} />

      <section aria-labelledby="categorias" className="mx-auto max-w-[1320px] px-4 pt-14 sm:px-6">
        <h2 id="categorias" className="sr-only">Categorias</h2>
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {HOME_CATEGORIES.map((c) => {
            const category = categories.find((x) => x.slug === c.slug);
            if (!category) return null;
            return (
              <CategoryCard
                key={c.slug}
                slug={c.slug}
                name={category.name}
                tagline={category.tagline ?? c.fallback}
                cta={c.cta}
                kind={category.variantKind}
                tint={c.tint}
              />
            );
          })}
        </div>
      </section>

      {highlights.length ? (
        <section aria-labelledby="destaques" className="mx-auto max-w-[1320px] px-4 pt-16 sm:px-6 sm:pt-20">
          <SectionTitle
            action={
              <Link href="/produtos" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-olive">
                Ver todos os produtos
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          >
            <span id="destaques">Destaques da Use Gazzeta</span>
          </SectionTitle>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-5">
            {highlights.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      ) : null}

      {fresh.length ? (
        <section aria-labelledby="novidades" className="mt-20 bg-sage-mist py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1320px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_2fr] lg:items-start">
            <div className="lg:sticky lg:top-40">
              <h2 id="novidades" className="font-serif text-[2.2rem] leading-[1.02] font-medium text-ink sm:text-[2.8rem]">
                Acabou de
                <span className="block text-olive italic">chegar</span>
              </h2>
              <p className="mt-4 max-w-xs text-stone-ink">
                As peças mais recentes da loja, com estoque conferido na hora.
              </p>
              <Link
                href="/produtos?filtro=novidades"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-olive px-6 text-sm font-semibold text-olive transition-colors hover:bg-olive hover:text-offwhite"
              >
                Ver todas as novidades <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-5">
              {fresh.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
