import type { Metadata } from "next";
import { ProductListing, parseSort } from "@/components/store/product-listing";
import { getPublicStore } from "@/services/store-service";
import { listCategories, listStoreProducts, type StoreListingFilter } from "@/services/product-service";

const FILTER_TITLES: Record<string, { title: string; subtitle: string }> = {
  novidades: { title: "Novidades", subtitle: "O que acabou de chegar na Use Gazzeta." },
  ofertas: { title: "Ofertas", subtitle: "Peças com preço especial enquanto durarem." },
  looks: { title: "Looks", subtitle: "Vestidos, conjuntos e peças para montar a produção." },
};

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ searchParams }: PageProps<"/produtos">): Promise<Metadata> {
  const sp = await searchParams;
  const filtro = first(sp.filtro);
  const q = first(sp.q);
  const title = q ? `Busca: ${q}` : filtro && FILTER_TITLES[filtro] ? FILTER_TITLES[filtro].title : "Todos os produtos";
  return { title, alternates: { canonical: filtro ? `/produtos?filtro=${filtro}` : "/produtos" } };
}

export default async function ProductsPage({ searchParams }: PageProps<"/produtos">) {
  const sp = await searchParams;
  const q = first(sp.q)?.slice(0, 80);
  const filtroRaw = first(sp.filtro);
  const filtro: StoreListingFilter =
    filtroRaw === "novidades" || filtroRaw === "ofertas" || filtroRaw === "looks" ? filtroRaw : null;
  const categoria = first(sp.categoria);
  const sort = parseSort(sp.ordem);

  const store = await getPublicStore();
  const [products, categories] = await Promise.all([
    listStoreProducts({
      storeId: store.id,
      settings: store,
      q,
      filter: filtro,
      categorySlug: categoria,
      sort,
    }),
    listCategories(store.id, true),
  ]);

  const meta = filtro ? FILTER_TITLES[filtro] : null;
  const chips = [
    { label: "Tudo", href: "/produtos", active: !filtro && !categoria },
    ...categories
      .filter((c) => (c.productCount ?? 0) > 0)
      .map((c) => ({ label: c.name, href: `/categoria/${c.slug}`, active: categoria === c.slug })),
    { label: "Novidades", href: "/produtos?filtro=novidades", active: filtro === "novidades" },
    { label: "Ofertas", href: "/produtos?filtro=ofertas", active: filtro === "ofertas" },
  ];

  return (
    <ProductListing
      title={q ? `“${q}”` : (meta?.title ?? "Todos os produtos")}
      subtitle={q ? "Resultados da sua busca." : (meta?.subtitle ?? "Moda, make, perfume e acessórios da Use Gazzeta.")}
      products={products}
      basePath="/produtos"
      params={{ q, filtro: filtro ?? undefined, categoria }}
      sort={sort}
      chips={chips}
    />
  );
}
