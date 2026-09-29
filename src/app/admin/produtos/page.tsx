import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterTabs, PageHeader } from "@/components/admin/page-header";
import { ProductTable } from "@/components/admin/product-table";
import { AdminSearch } from "@/components/admin/admin-search";
import { EmptyState } from "@/components/shared/misc";
import { requirePageUser } from "@/lib/session";
import { countProductsByCategory, listAdminProducts, listCategories } from "@/services/product-service";

export const metadata: Metadata = { title: "Produtos" };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/produtos">) {
  const user = await requirePageUser("products");
  const sp = await searchParams;
  const categoria = first(sp.categoria);
  const q = first(sp.q);
  const status = first(sp.status) === "arquivados" ? "inactive" : "all";

  const [rows, categories, counts] = await Promise.all([
    listAdminProducts({ storeId: user.storeId, categorySlug: categoria, q, status }),
    listCategories(user.storeId),
    countProductsByCategory(user.storeId),
  ]);

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { categoria, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/produtos?${s}` : "/admin/produtos";
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Produtos"
        description="Gerencie seu catálogo de roupas, maquiagens e perfumes."
        actions={
          <Button asChild variant="gold" size="lg">
            <Link href="/admin/produtos/novo">
              <Plus /> Novo produto
            </Link>
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          items={[
            { label: "Todos", href: qs({ categoria: undefined }), active: !categoria, count: counts.total },
            ...categories.map((c) => ({
              label: c.name,
              href: qs({ categoria: c.slug }),
              active: categoria === c.slug,
              count: counts.bySlug[c.slug] ?? 0,
            })),
          ]}
        />
        <AdminSearch placeholder="Buscar produto, SKU ou código de barras" basePath="/admin/produtos" params={{ categoria }} />
      </div>
      {rows.length ? (
        <ProductTable rows={rows} highlight={rows.length === 1 ? rows[0].id : null} />
      ) : (
        <EmptyState
          icon={<PackageSearch />}
          title={q ? "Nada encontrado" : "Nenhum produto nesta categoria"}
          description={q ? `Nenhum produto, SKU ou código de barras corresponde a “${q}”.` : "Cadastre o primeiro produto ou use o scanner para o cadastro rápido."}
          action={
            <Button asChild>
              <Link href="/admin/produtos/novo">
                <Plus /> Novo produto
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
