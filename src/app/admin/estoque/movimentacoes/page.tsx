import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PackagePlus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterTabs, PageHeader } from "@/components/admin/page-header";
import { StockMovementTable } from "@/components/admin/stock-movement-table";
import { EmptyState } from "@/components/shared/misc";
import { StockBadge } from "@/components/shared/stock-badge";
import { MOVEMENT_TYPE_LABELS, type InventoryMovementType } from "@/lib/constants";
import { variantLabel } from "@/lib/variant";
import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listMovements } from "@/services/inventory-service";

export const metadata: Metadata = { title: "Movimentações de estoque" };

const PAGE = 50;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function MovementsPage({ searchParams }: PageProps<"/admin/estoque/movimentacoes">) {
  const user = await requirePageUser("inventory");
  const sp = await searchParams;
  const variantId = first(sp.variante) ?? null;
  const productId = first(sp.produto) ?? null;
  const typeRaw = first(sp.tipo);
  const type = typeRaw && typeRaw in MOVEMENT_TYPE_LABELS ? (typeRaw as InventoryMovementType) : null;
  const page = Math.max(1, Number(first(sp.pagina)) || 1);

  const [data, variant, product] = await Promise.all([
    listMovements({ storeId: user.storeId, variantId, productId, type, take: PAGE, skip: (page - 1) * PAGE }),
    variantId
      ? prisma.productVariant.findFirst({
          where: { id: variantId, product: { storeId: user.storeId } },
          include: { product: { select: { id: true, name: true } } },
        })
      : null,
    productId ? prisma.product.findFirst({ where: { id: productId, storeId: user.storeId }, select: { id: true, name: true } }) : null,
  ]);

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ variante: variantId ?? undefined, produto: productId ?? undefined, tipo: type ?? undefined, ...patch }))
      if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/estoque/movimentacoes?${s}` : "/admin/estoque/movimentacoes";
  };
  const pages = Math.max(1, Math.ceil(data.total / PAGE));

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        back={{ href: "/admin/estoque", label: "Estoque" }}
        title={variant ? `${variant.product.name}` : product ? product.name : "Movimentações"}
        description={
          variant
            ? `Histórico da variante ${variantLabel(variant)} · SKU ${variant.sku}`
            : product
              ? "Histórico de todas as variantes deste produto."
              : "Toda alteração de estoque, com estoque anterior e posterior."
        }
        actions={
          variant ? (
            <>
              <StockBadge stock={variant.stock} minimumStock={variant.minimumStock} className="h-10 px-4 text-sm" />
              <Button asChild variant="outline">
                <Link href={`/admin/estoque/ajuste?variante=${variant.id}`}>
                  <SlidersHorizontal /> Ajustar
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/admin/estoque/entrada?variante=${variant.id}`}>
                  <PackagePlus /> Entrada
                </Link>
              </Button>
            </>
          ) : undefined
        }
      />
      <FilterTabs
        className="mb-5"
        items={[
          { label: "Todos os tipos", href: href({ tipo: undefined, pagina: undefined }), active: !type },
          ...(Object.keys(MOVEMENT_TYPE_LABELS) as InventoryMovementType[]).map((t) => ({
            label: MOVEMENT_TYPE_LABELS[t],
            href: href({ tipo: t, pagina: undefined }),
            active: type === t,
          })),
        ]}
      />
      {data.items.length ? (
        <>
          <StockMovementTable items={data.items} showProduct={!variant} />
          {pages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-stone-ink">
                Página {page} de {pages} · {data.total} movimentações
              </span>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className={page <= 1 ? "pointer-events-none opacity-40" : ""}>
                  <Link href={href({ pagina: String(page - 1) })}>
                    <ChevronLeft /> Anterior
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className={page >= pages ? "pointer-events-none opacity-40" : ""}>
                  <Link href={href({ pagina: String(page + 1) })}>
                    Próxima <ChevronRight />
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState title="Nenhuma movimentação" description="As entradas, vendas e ajustes aparecem aqui." />
      )}
    </div>
  );
}
