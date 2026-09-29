import type { Metadata } from "next";
import Link from "next/link";
import { FilterTabs, PageHeader, Panel } from "@/components/admin/page-header";
import { HBarList, RevenueChart, type RevenuePoint } from "@/components/admin/charts";
import { DemoNote, EmptyState } from "@/components/shared/misc";
import { formatBRL } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import {
  addDays,
  formatDate,
  isPeriodKey,
  PERIOD_LABELS,
  periodRange,
  shortDayLabel,
  shortMonthLabel,
  startOfStoreDay,
  type PeriodKey,
} from "@/lib/dates";
import { requirePageUser } from "@/lib/session";
import { getReport } from "@/services/report-service";

export const metadata: Metadata = { title: "Relatórios" };

function parseDay(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function points(series: { key: string; total: number; store: number; online: number; count: number }[], bucket: "day" | "month" | "hour"): RevenuePoint[] {
  return series.map((p) => ({
    ...p,
    label: bucket === "month" ? shortMonthLabel(p.key) : shortDayLabel(p.key),
    tooltipLabel: bucket === "month" ? shortMonthLabel(p.key) : shortDayLabel(p.key),
  }));
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-paper p-5 shadow-soft">
      <p className="text-sm text-stone-ink">{label}</p>
      <p className="mt-2 text-[1.75rem] leading-none font-semibold">{value}</p>
      {hint ? <p className="mt-2 text-xs text-stone-ink">{hint}</p> : null}
    </div>
  );
}

export default async function ReportsPage({ searchParams }: PageProps<"/admin/relatorios">) {
  const user = await requirePageUser("reports");
  const sp = await searchParams;
  const customFrom = parseDay(sp.de);
  const customTo = parseDay(sp.ate);
  const period: PeriodKey = isPeriodKey(sp.periodo) ? sp.periodo : "30d";
  const range =
    customFrom && customTo && customTo >= customFrom
      ? { from: startOfStoreDay(customFrom), to: addDays(startOfStoreDay(customTo), 1) }
      : periodRange(period);
  const custom = Boolean(customFrom && customTo);
  const r = await getReport(user.storeId, range.from, range.to);
  const s = r.summary;
  const rangeLabel = `${formatDate(range.from)} a ${formatDate(addDays(range.to, -1))}`;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Relatórios" description={`Faturamento, lucro e o que mais vende · ${rangeLabel}`} />

      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterTabs
          items={(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((p) => ({
            label: PERIOD_LABELS[p],
            href: `/admin/relatorios?periodo=${p}`,
            active: !custom && p === period,
          }))}
        />
        <form className="flex flex-wrap items-end gap-2 text-sm" action="/admin/relatorios">
          <label className="flex flex-col gap-1 text-xs text-stone-ink">
            De
            <input type="date" name="de" defaultValue={typeof sp.de === "string" ? sp.de : ""} className="h-9 rounded-xl border border-hairline bg-paper px-2.5 text-sm text-ink" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-stone-ink">
            Até
            <input type="date" name="ate" defaultValue={typeof sp.ate === "string" ? sp.ate : ""} className="h-9 rounded-xl border border-hairline bg-paper px-2.5 text-sm text-ink" />
          </label>
          <button type="submit" className="h-9 rounded-xl bg-olive px-4 text-sm font-semibold text-offwhite">
            Aplicar
          </button>
        </form>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Faturamento" value={formatBRL(s.revenue)} hint={`Loja ${formatBRL(s.storeRevenue)} · Online ${formatBRL(s.onlineRevenue)}`} />
        <Tile label="Lucro estimado" value={formatBRL(s.estimatedProfit)} hint={`Margem ${s.margin.toLocaleString("pt-BR")}% · custo ${formatBRL(s.cost)}`} />
        <Tile label="Ticket médio" value={formatBRL(s.averageTicket)} hint={`${s.itemsSold} peças vendidas`} />
        <Tile label="Número de vendas" value={String(s.count)} hint={`${s.storeCount} na loja · ${s.onlineCount} online`} />
      </section>
      <p className="mt-2 text-xs text-stone-ink">
        Faturamento considera vendas do PDV concluídas e pedidos online pagos, já com descontos e sem frete ({formatBRL(s.shipping)} de frete no período).
      </p>
      {process.env.NEXT_PUBLIC_DEMO_DATA !== "false" ? <DemoNote className="mt-1" /> : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel title={r.bucket === "month" ? "Vendas por mês" : "Vendas por dia"} action={<span className="text-xs text-stone-ink">em R$</span>}>
          {s.revenue > 0 ? <RevenueChart data={points(r.series, r.bucket)} /> : <EmptyState title="Sem vendas no período" />}
        </Panel>
        <Panel title="Formas de pagamento">
          <HBarList
            items={r.payments.map((p) => ({ label: PAYMENT_METHOD_LABELS[p.method], value: p.amount, hint: `${p.count}×` }))}
          />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Últimos 12 meses" action={<span className="text-xs text-stone-ink">em R$</span>}>
          <RevenueChart data={points(r.monthly, "month")} height={220} />
        </Panel>
        <Panel title="Categorias mais vendidas">
          <HBarList items={r.categories.map((c) => ({ label: c.name, value: c.revenue, hint: `${c.quantity} un.` }))} />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Variantes mais vendidas" bodyClassName="pt-3">
          {r.topVariants.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-stone-ink">
                  <th className="py-2 font-semibold">Produto</th>
                  <th className="py-2 font-semibold">Variante</th>
                  <th className="py-2 text-right font-semibold">Qtd.</th>
                  <th className="py-2 text-right font-semibold">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {r.topVariants.map((v) => (
                  <tr key={v.variantId}>
                    <td className="py-2.5">
                      <Link href={`/admin/produtos/${v.productId}`} className="font-medium hover:text-olive">
                        {v.productName}
                      </Link>
                    </td>
                    <td className="py-2.5 text-stone-ink">{v.variantLabel}</td>
                    <td className="py-2.5 text-right tabular">{v.quantity}</td>
                    <td className="py-2.5 text-right font-semibold whitespace-nowrap tabular">{formatBRL(v.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-6 text-center text-sm text-stone-ink">Sem vendas no período.</p>
          )}
        </Panel>
        <Panel title="Produtos mais vendidos" bodyClassName="pt-3">
          {r.topProducts.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-stone-ink">
                  <th className="py-2 font-semibold">Produto</th>
                  <th className="py-2 text-right font-semibold">Qtd.</th>
                  <th className="py-2 text-right font-semibold">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {r.topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td className="py-2.5 font-medium">{p.productName}</td>
                    <td className="py-2.5 text-right tabular">{p.quantity}</td>
                    <td className="py-2.5 text-right font-semibold whitespace-nowrap tabular">{formatBRL(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-6 text-center text-sm text-stone-ink">Sem vendas no período.</p>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title={`Sem estoque (${r.outOfStock.length})`} bodyClassName="pt-3">
          <ul className="divide-y divide-hairline text-sm">
            {r.outOfStock.length ? (
              r.outOfStock.map((v) => (
                <li key={v.variantId} className="flex justify-between gap-3 py-2.5">
                  <span>
                    {v.productName} <span className="text-stone-ink">· {v.label}</span>
                  </span>
                  <Link href={`/admin/estoque/entrada?variante=${v.variantId}`} className="text-xs font-semibold text-olive hover:underline">
                    Dar entrada
                  </Link>
                </li>
              ))
            ) : (
              <li className="py-4 text-center text-stone-ink">Nenhuma variante esgotada.</li>
            )}
          </ul>
        </Panel>
        <Panel title={`Estoque baixo (${r.lowStock.length})`} bodyClassName="pt-3">
          <ul className="divide-y divide-hairline text-sm">
            {r.lowStock.length ? (
              r.lowStock.map((v) => (
                <li key={v.variantId} className="flex justify-between gap-3 py-2.5">
                  <span>
                    {v.productName} <span className="text-stone-ink">· {v.label}</span>
                  </span>
                  <span className="text-xs font-semibold text-gold-ink tabular">
                    {v.stock} / mín. {v.minimumStock}
                  </span>
                </li>
              ))
            ) : (
              <li className="py-4 text-center text-stone-ink">Nenhuma variante abaixo do mínimo.</li>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
