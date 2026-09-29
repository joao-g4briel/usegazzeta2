import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ReceiptText, ShoppingBag } from "lucide-react";
import { FilterTabs, PageHeader } from "@/components/admin/page-header";
import { AdminSearch } from "@/components/admin/admin-search";
import { OrderTable } from "@/components/admin/order-table";
import { SaleStatusBadge } from "@/components/admin/badges";
import { EmptyState } from "@/components/shared/misc";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type OrderStatus } from "@/lib/constants";
import { requirePageUser } from "@/lib/session";
import { countOrdersByStatus, listOrders } from "@/services/order-service";
import { listSales } from "@/services/sale-service";

export const metadata: Metadata = { title: "Pedidos" };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const user = await requirePageUser("orders");
  const sp = await searchParams;
  const canal = first(sp.canal) === "loja" ? "loja" : "online";
  const statusRaw = first(sp.status);
  const status = statusRaw && statusRaw in ORDER_STATUS_LABELS ? (statusRaw as OrderStatus) : null;
  const q = first(sp.q);

  const [orders, counts, sales] = await Promise.all([
    canal === "online" ? listOrders({ storeId: user.storeId, status, q, take: 100 }) : Promise.resolve([]),
    countOrdersByStatus(user.storeId),
    canal === "loja" ? listSales({ storeId: user.storeId, q, take: 100 }) : Promise.resolve([]),
  ]);
  const total = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Pedidos e vendas" description="Pedidos da loja virtual e vendas feitas no PDV." />

      <div className="mb-5 grid w-full max-w-md grid-cols-2 gap-1 rounded-2xl bg-linen p-1">
        {(
          [
            ["online", "Pedidos online", ShoppingBag],
            ["loja", "Vendas presenciais", ReceiptText],
          ] as const
        ).map(([c, label, Icon]) => (
          <Link
            key={c}
            href={c === "online" ? "/admin/pedidos" : "/admin/pedidos?canal=loja"}
            aria-current={canal === c ? "page" : undefined}
            className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold", canal === c ? "bg-paper shadow-soft" : "text-stone-ink")}
          >
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {canal === "online" ? (
          <FilterTabs
            items={[
              { label: "Todos", href: "/admin/pedidos", active: !status, count: total },
              ...(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => ({
                label: ORDER_STATUS_LABELS[s],
                href: `/admin/pedidos?status=${s}`,
                active: status === s,
                count: counts[s] ?? 0,
              })),
            ]}
          />
        ) : (
          <span />
        )}
        <AdminSearch
          placeholder={canal === "online" ? "Número, cliente ou e-mail" : "Número, cliente ou produto"}
          basePath="/admin/pedidos"
          params={{ canal: canal === "loja" ? "loja" : undefined, status: status ?? undefined }}
        />
      </div>

      {canal === "online" ? (
        orders.length ? (
          <div className="rounded-2xl border border-hairline bg-paper px-4 py-2 shadow-soft sm:px-5">
            <OrderTable orders={orders} />
          </div>
        ) : (
          <EmptyState icon={<ShoppingBag />} title="Nenhum pedido encontrado" description="Os pedidos feitos na loja virtual aparecem aqui." />
        )
      ) : sales.length ? (
        <div className="relative overflow-x-auto rounded-2xl border border-hairline bg-paper shadow-soft">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs text-stone-ink">
                <th className="px-5 py-3 font-semibold">Venda</th>
                <th className="px-3 py-3 font-semibold">Cliente</th>
                <th className="px-3 py-3 font-semibold">Itens</th>
                <th className="px-3 py-3 font-semibold">Pagamento</th>
                <th className="px-3 py-3 text-right font-semibold">Total</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Data</th>
                <th className="px-5 py-3"><span className="sr-only">Abrir</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-offwhite">
                  <td className="px-5 py-3 font-semibold tabular">#{s.number}</td>
                  <td className="px-3 py-3">{s.customerName ?? <span className="text-stone-ink">—</span>}</td>
                  <td className="px-3 py-3 tabular">{s.itemCount}</td>
                  <td className="px-3 py-3 text-stone-ink">{s.methods.map((m) => PAYMENT_METHOD_LABELS[m]).join(" + ")}</td>
                  <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular">{formatBRL(s.total)}</td>
                  <td className="px-3 py-3"><SaleStatusBadge status={s.status} /></td>
                  <td className="px-3 py-3 whitespace-nowrap text-stone-ink tabular">{formatDateTime(s.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/vendas/${s.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-olive hover:bg-sage-mist">
                      Abrir <ChevronRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={<ReceiptText />} title="Nenhuma venda presencial" description="As vendas finalizadas no PDV aparecem aqui." />
      )}
    </div>
  );
}
