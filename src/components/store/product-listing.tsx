import Link from "next/link";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/misc";
import { ProductCard } from "@/components/store/product-card";
import type { StoreListingSort } from "@/services/product-service";
import type { StoreProductCard } from "@/types/catalog";

const SORTS: { value: StoreListingSort; label: string }[] = [
  { value: "relevancia", label: "Destaques" },
  { value: "novidades", label: "Novidades" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
];

export function ProductListing({
  title,
  subtitle,
  products,
  basePath,
  params,
  sort,
  chips,
}: {
  title: string;
  subtitle?: string | null;
  products: StoreProductCard[];
  basePath: string;
  params: Record<string, string | undefined>;
  sort: StoreListingSort;
  chips?: { label: string; href: string; active: boolean }[];
}) {
  const hrefWith = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...patch })) if (v) sp.set(k, v);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <header className="flex flex-col gap-2 border-b border-hairline pb-6">
        <h1 className="font-serif text-[2.6rem] leading-none font-medium text-ink sm:text-[3.4rem]">{title}</h1>
        {subtitle ? <p className="max-w-xl text-stone-ink">{subtitle}</p> : null}
      </header>

      <div className="sticky top-[7.25rem] z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 bg-offwhite/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:top-[7.5rem]">
        {chips?.length ? (
          <nav aria-label="Filtros" className="no-scrollbar -mx-1 flex max-w-full gap-2 overflow-x-auto px-1">
            {chips.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                aria-current={c.active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                  c.active
                    ? "border-olive bg-olive text-offwhite"
                    : "border-[#dcd3c4] bg-paper text-ink hover:border-olive",
                )}
              >
                {c.label}
              </Link>
            ))}
          </nav>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-stone-ink tabular">
            {products.length} {products.length === 1 ? "peça" : "peças"}
          </span>
          <nav aria-label="Ordenar" className="flex items-center gap-1 rounded-full bg-linen p-1">
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={hrefWith({ ordem: s.value === "relevancia" ? undefined : s.value })}
                aria-current={sort === s.value ? "true" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[0.8rem] font-medium whitespace-nowrap",
                  sort === s.value ? "bg-paper text-ink shadow-soft" : "text-stone-ink hover:text-ink",
                  s.value === "novidades" && "max-sm:hidden",
                )}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {products.length ? (
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          icon={<SearchX />}
          title="Nenhuma peça encontrada"
          description="Tente outra palavra ou veja todas as peças da loja."
          action={
            <Link href="/produtos" className="text-sm font-semibold text-olive underline-offset-4 hover:underline">
              Ver todos os produtos
            </Link>
          }
        />
      )}
    </div>
  );
}

export function parseSort(value: string | string[] | undefined): StoreListingSort {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "menor-preco" || v === "maior-preco" || v === "novidades" ? v : "relevancia";
}

