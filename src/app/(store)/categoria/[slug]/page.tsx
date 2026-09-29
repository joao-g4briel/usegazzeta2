import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing, parseSort } from "@/components/store/product-listing";
import { getPublicStore } from "@/services/store-service";
import { listCategories, listStoreProducts } from "@/services/product-service";

export async function generateMetadata({ params }: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStore();
  const category = (await listCategories(store.id, true)).find((c) => c.slug === slug);
  if (!category) return { title: "Categoria" };
  return {
    title: category.name,
    description: category.description ?? category.tagline ?? undefined,
    alternates: { canonical: `/categoria/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/categoria/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const sort = parseSort(sp.ordem);
  const store = await getPublicStore();
  const categories = await listCategories(store.id, true);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const products = await listStoreProducts({ storeId: store.id, settings: store, categorySlug: slug, sort });
  const chips = [
    { label: "Tudo", href: "/produtos", active: false },
    ...categories
      .filter((c) => (c.productCount ?? 0) > 0)
      .map((c) => ({ label: c.name, href: `/categoria/${c.slug}`, active: c.slug === slug })),
    { label: "Ofertas", href: "/produtos?filtro=ofertas", active: false },
  ];

  return (
    <ProductListing
      title={category.name}
      subtitle={category.tagline ?? category.description}
      products={products}
      basePath={`/categoria/${slug}`}
      params={{}}
      sort={sort}
      chips={chips}
    />
  );
}
