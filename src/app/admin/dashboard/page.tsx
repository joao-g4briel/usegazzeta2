import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, CircleDollarSign, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterTabs, Panel } from "@/components/admin/page-header";
import { DashboardCard } from "@/components/admin/dashboard-card";
import { RevenueChart, StatusDonut, type RevenuePoint } from "@/components/admin/charts";
import { OrderTable } from "@/components/admin/order-table";
import { LowStockList } from "@/components/admin/low-stock-list";
import { DemoNote, EmptyState } from "@/components/shared/misc";
import { requirePageUser } from "@/lib/session";
import { formatBRL } from "@/lib/money";
import { formatLongDate, isPeriodKey, PERIOD_LABELS, shortDayLabel, shortMonthLabel, type PeriodKey } from "@/lib/dates";
import { getDashboard } from "@/services/report-service";

export const metadata: Metadata = { title: "Dashboard" };

function toPoints(series: { key: string; total: number; store: number; online: number; count: number }[], bucket: string): RevenuePoint[] {
  return series.map((p) => ({
    ...p,
    label: bucket === "hour" ? `${p.key}h` : bucket === "month" ? shortMonthLabel(p.key) : shortDayLabel(p.key),
    tooltipLabel:
      bucket === "hour" ? `Hoje, ${p.key}h` : bucket === "month" ? shortMonthLabel(p.key) : shortDayLabel(p.key),
  }));
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin/dashboard">) {
  const user = await requirePageUser("dashboard");
  const sp = await searchParams;
  const period: PeriodKey = isPeriodKey(sp.periodo) ? sp.periodo : "30d";
  const data = await getDashboard(user.storeId, period);
  const firstName = user.name.split(" ")[0];
  const c = data.cards;

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-[2.2rem] leading-tight font-medium sm:text-[2.6rem]">
            Bem-vinda{firstName && firstName !== "Administradora" ? `, ${firstName}` : ""}!
          </h1>
          <p className="mt-1 text-[0.95rem] text-stone-ink">Aqui está um resumo da sua loja Use Gazzeta hoje.</p>
          {process.env.NEXT_PUBLIC_DEMO_DATA !== "false" ? <DemoNote className="mt-1" /> : null}
        </div>
        <p className="inline-flex items-center gap-2 text-sm text-stone-ink">
          <CalendarDays className="size-4 text-olive" />
          <span>{capitalize(formatLongDate(new Date()))}</span>
        </p>
      </div>

      <section aria-label="Resumo de hoje" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <DashboardCard
          label="Vendas hoje"
          value={formatBRL(c.salesToday)}
          icon={CircleDollarSign}
          tone="beige"
          delta={c.salesChange}
          deltaLabel="em relação a ontem"
        />
        <DashboardCard
          label="Pedidos hoje"
          value={String(c.purchasesToday)}
          icon={ShoppingCart}
          tone="sage"
          delta={c.purchasesChange}
          deltaLabel={`${c.purchasesOnlineToday} online · ${c.purchasesStoreToday} na loja`}
        />
        <DashboardCard
          label="Produtos cadastrados"
          value={String(c.productsCount)}
          icon={Package}
          tone="sage"
          note={c.productsThisMonth ? `+${c.productsThisMonth} neste mês` : "ativos no catálogo"}
        />
        <DashboardCard
          label="Estoque baixo"
          value={String(c.lowStockCount)}
          icon={AlertTriangle}
          tone="rose"
          note={`variantes no mínimo · ${c.outOfStockCount} esgotadas`}
        />
      </section>

      {/* Uma linha de filtros escopa os gráficos abaixo */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          items={(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((p) => ({
            label: PERIOD_LABELS[p],
            href: `/admin/dashboard?periodo=${p}`,
            active: p === period,
          }))}
        />
        <p className="text-sm text-stone-ink">
          Faturamento no período: <span className="font-semibold text-ink">{formatBRL(data.periodTotal)}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <Panel title={`Vendas · ${PERIOD_LABELS[period].toLowerCase()}`} action={<span className="text-xs text-stone-ink">em R$</span>}>
          {data.periodTotal > 0 ? (
            <>
              <RevenueChart data={toPoints(data.series, data.bucket)} />
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-xs font-semibold text-olive">Ver dados em tabela</summary>
                <div className="mt-2 max-h-56 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-stone-ink">
                      <tr><th className="py-1">Período</th><th className="py-1 text-right">Loja</th><th className="py-1 text-right">Online</th><th className="py-1 text-right">Total</th></tr>
                    </thead>
                    <tbody className="tabular">
                      {toPoints(data.series, data.bucket).map((p) => (
                        <tr key={p.label} className="border-t border-hairline">
                          <td className="py-1">{p.tooltipLabel}</td>
                          <td className="py-1 text-right">{formatBRL(p.store)}</td>
                          <td className="py-1 text-right">{formatBRL(p.online)}</td>
                          <td className="py-1 text-right font-semibold">{formatBRL(p.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          ) : (
            <EmptyState
              title="Sem vendas neste período"
              description="As vendas do PDV e os pedidos pagos aparecem aqui assim que acontecerem."
              action={
                <Button asChild variant="soft" size="sm">
                  <Link href="/pdv">Abrir PDV</Link>
                </Button>
              }
            />
          )}
        </Panel>
        <Panel title="Status dos pedidos online">
          <StatusDonut data={data.statuses} caption="pedidos" />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <Panel
          title="Pedidos recentes"
          action={
            <Link href="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-olive">
              Ver todos <ArrowRight className="size-4" />
            </Link>
          }
          bodyClassName="pt-3"
        >
          {data.recentOrders.length ? (
            <OrderTable orders={data.recentOrders} compact />
          ) : (
            <EmptyState title="Nenhum pedido ainda" description="Os pedidos da loja virtual aparecem aqui." />
          )}
        </Panel>
        <Panel
          title="Estoque baixo"
          action={
            <Link href="/admin/estoque?filtro=low" className="inline-flex items-center gap-1 text-sm font-semibold text-olive">
              Ver todos <ArrowRight className="size-4" />
            </Link>
          }
          bodyClassName="pt-2"
        >
          <LowStockList items={data.lowStock} />
        </Panel>
      </div>
    </div>
  );
}
