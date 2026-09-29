import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, History, PackagePlus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterTabs, PageHeader } from "@/components/admin/page-header";
import { AdminSearch } from "@/components/admin/admin-search";
import { EmptyState } from "@/components/shared/misc";
import { ProductImage } from "@/components/shared/product-image";
import { StockLevelLabel } from "@/components/shared/stock-badge";
import { cn } from "@/lib/utils";
import { swatchFor } from "@/lib/constants";
import { adminStockLevel } from "@/lib/variant";
import { requirePageUser } from "@/lib/session";
import { getStockCounts, getStockOverview, type StockFilter, type StockGroup } from "@/services/inventory-service";
import { listCategories } from "@/services/product-service";

export const metadata: Metadata = { title: "Estoque" };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function levelClasses(stock: number, min: number) {
  const level = adminStockLevel(stock, min);
  return level === "out"
    ? "border-rose/70 bg-rose-mist text-rose-deep"
    : level === "low"
      ? "border-gold/50 bg-gold-mist text-gold-ink"
      : "border-hairline bg-paper text-ink";
}

// Agrupa por cor quando há cor (Amarelo: P — 3 · M — 5 · G — 2).
function VariantGrid({ group }: { group: StockGroup }) {
  const variants = group.variants.filter((v) => v.active);
  const byColor = new Map<string, typeof variants>();
  for (const v of variants) {
    const key = v.color ?? "";
    byColor.set(key, [...(byColor.get(key) ?? []), v]);
  }
  return (
    <div className="space-y-3">
      {[...byColor.entries()].map(([color, list]) => (
        <div key={color || "_"} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {color ? (
            <p className="flex w-32 shrink-0 items-center gap-2 text-sm font-semibold">
              <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: swatchFor(color) ?? "#ddd" }} />
              {color}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {list.map((v) => {
              const name = [v.size, v.tone, v.volume].filter(Boolean).join(" · ") || (color ? "Único" : "Padrão");
              return (
                <Link
                  key={v.id}
                  href={`/admin/estoque/movimentacoes?variante=${v.id}`}
                  title={`SKU ${v.sku} · mínimo ${v.minimumStock}`}
                  className={cn("flex min-w-[5.5rem] flex-col rounded-xl border px-3 py-2 transition-shadow hover:shadow-soft", levelClasses(v.stock, v.minimumStock))}
                >
                  <span className="text-xs font-medium opacity-90">{name}</span>
                  <span className="text-lg leading-tight font-bold tabular">{v.stock}</span>
                  <StockLevelLabel stock={v.stock} minimumStock={v.minimumStock} />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function StockPage({ searchParams }: PageProps<"/admin/estoque">) {
  const user = await requirePageUser("inventory");
  const sp = await searchParams;
  const filtroRaw = first(sp.filtro);
  const filter: StockFilter = filtroRaw === "low" || filtroRaw === "out" || filtroRaw === "normal" ? filtroRaw : "all";
  const categoria = first(sp.categoria);
  const q = first(sp.q);

  const [groups, counts, categories] = await Promise.all([
    getStockOverview({ storeId: user.storeId, filter, categorySlug: categoria, q }),
    getStockCounts(user.storeId),
    listCategories(user.storeId),
  ]);

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ filtro: filter === "all" ? undefined : filter, categoria, q, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/estoque?${s}` : "/admin/estoque";
  };
  const openAll = filter !== "all" || Boolean(q);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Estoque"
        description="Um único estoque por variante — o mesmo número na loja, no painel e no PDV."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/estoque/movimentacoes">
                <History /> Movimentações
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/estoque/ajuste">
                <SlidersHorizontal /> Ajuste
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/estoque/entrada">
                <PackagePlus /> Entrada de estoque
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          items={[
            { label: "Todos", href: href({ filtro: undefined }), active: filter === "all", count: counts.variants },
            { label: "Estoque normal", href: href({ filtro: "normal" }), active: filter === "normal", count: counts.normal },
            { label: "Estoque baixo", href: href({ filtro: "low" }), active: filter === "low", count: counts.low },
            { label: "Sem estoque", href: href({ filtro: "out" }), active: filter === "out", count: counts.out },
          ]}
        />
        <AdminSearch placeholder="Produto, variante, SKU ou código" basePath="/admin/estoque" params={{ filtro: filter === "all" ? undefined : filter, categoria }} />
      </div>
      <FilterTabs
        className="mb-5"
        items={[
          { label: "Todas as categorias", href: href({ categoria: undefined }), active: !categoria },
          ...categories.map((c) => ({ label: c.name, href: href({ categoria: c.slug }), active: categoria === c.slug })),
        ]}
      />
      <p className="mb-4 text-xs text-stone-ink">
        Contagens por variante. O alerta vale para cada variante em relação ao seu próprio estoque mínimo.
      </p>

      {groups.length ? (
        <ul className="space-y-3">
          {groups.map((g) => (
            <li key={g.id}>
              <details open={openAll} className="group rounded-2xl border border-hairline bg-paper shadow-soft">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:gap-4">
                  <ProductImage src={g.image} alt={g.name} kind={g.category.variantKind} tint={swatchFor(g.variants.find((v) => v.color)?.color)} monogram={false} sizes="52px" className="size-13 shrink-0 rounded-xl" artClassName="h-[80%]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{g.name}</p>
                    <p className="text-xs text-stone-ink">
                      {g.category.name} · {g.variants.filter((v) => v.active).length}{" "}
                      {g.variants.filter((v) => v.active).length === 1 ? "variante" : "variantes"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {g.outCount ? <span className="rounded-full bg-rose-mist px-2.5 py-1 text-xs font-semibold text-rose-deep">{g.outCount} sem estoque</span> : null}
                    {g.lowCount ? <span className="rounded-full bg-gold-mist px-2.5 py-1 text-xs font-semibold text-gold-ink">{g.lowCount} baixo</span> : null}
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-[0.68rem] text-stone-ink">Estoque total</p>
                    <p className="text-xl leading-none font-bold tabular">{g.totalStock}</p>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-stone-ink transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-hairline px-4 pt-4 pb-5">
                  <VariantGrid group={g} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="soft">
                      <Link href={`/admin/produtos/${g.id}`}>Editar produto</Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/estoque/movimentacoes?produto=${g.id}`}>
                        <History /> Histórico do produto
                      </Link>
                    </Button>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={filter === "low" ? "Nenhuma variante com estoque baixo" : filter === "out" ? "Nenhuma variante esgotada" : "Nada encontrado"}
          description="Ajuste os filtros para ver outras variantes."
        />
      )}
    </div>
  );
}
