"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

// Cores validadas (dataviz validate_palette, superfície #FFFDF9):
// série única = oliva da marca; donut de status = 4 tons derivados da paleta.
export const CHART = {
  single: "#5F735B",
  singleHover: "#4A5B47",
  grid: "#EEE7DB",
  axis: "#5F625E",
  status: {
    entregues: "#3E8050",
    transporte: "#C9962E",
    processando: "#7A6FB8",
    cancelados: "#C85F73",
  } as Record<string, string>,
};

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export type RevenuePoint = { label: string; tooltipLabel: string; total: number; store: number; online: number; count: number };

function RevenueTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as RevenuePoint;
  return (
    <div className="min-w-44 rounded-xl border border-hairline bg-paper px-3.5 py-3 text-sm shadow-lift">
      <p className="text-xs text-stone-ink">{p.tooltipLabel}</p>
      <p className="mt-0.5 text-base font-bold text-ink">{formatBRL(p.total)}</p>
      <div className="mt-2 space-y-1 text-xs text-stone-ink">
        <p className="flex justify-between gap-4">
          <span>Loja física</span>
          <span className="font-semibold text-ink tabular">{formatBRL(p.store)}</span>
        </p>
        <p className="flex justify-between gap-4">
          <span>Online</span>
          <span className="font-semibold text-ink tabular">{formatBRL(p.online)}</span>
        </p>
        <p className="flex justify-between gap-4">
          <span>Vendas</span>
          <span className="font-semibold text-ink tabular">{p.count}</span>
        </p>
      </div>
    </div>
  );
}

export function RevenueChart({ data, height = 260 }: { data: RevenuePoint[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.total));
  const peak = data.findIndex((d) => d.total === max && max > 0);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 22, right: 26, bottom: 0, left: 0 }}
          barCategoryGap="22%"
          onMouseLeave={() => setHover(null)}
        >
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: CHART.grid }}
            tick={{ fontSize: 11, fill: CHART.axis }}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fontSize: 11, fill: CHART.axis }}
            tickFormatter={(v: number) => (v === 0 ? "0" : compact.format(v))}
          />
          <Tooltip
            content={(props) => <RevenueTooltip {...(props as TooltipContentProps<number, string>)} />}
            cursor={{ fill: "rgb(135 151 124 / 0.12)" }}
          />
          <Bar
            dataKey="total"
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
            onMouseEnter={(_, index) => setHover(index)}
            label={(props: { x?: number | string; y?: number | string; width?: number | string; index?: number }) =>
              props.index === peak ? (
                <text
                  x={Number(props.x) + Number(props.width) / 2}
                  y={Number(props.y) - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#171A18"
                >
                  {`R$ ${compact.format(max)}`}
                </text>
              ) : (
                <g />
              )
            }
          >
            {data.map((d, i) => (
              <Cell key={d.label + i} fill={hover === i ? CHART.singleHover : CHART.single} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type StatusSliceData = { key: string; label: string; value: number };

// Percentuais que somam exatamente 100 (maior resto).
function wholePercents(values: number[]) {
  const total = values.reduce((s, v) => s + v, 0);
  if (!total) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floors = raw.map((r) => Math.floor(r));
  let left = 100 - floors.reduce((s, v) => s + v, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors;
}

export function StatusDonut({ data, caption }: { data: StatusSliceData[]; caption: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const percents = wholePercents(data.map((d) => d.value));
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center xl:gap-4 2xl:gap-6">
      <div className="relative size-40 shrink-0 xl:size-32 2xl:size-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={total ? data : [{ key: "vazio", label: "Sem pedidos", value: 1 }]}
              dataKey="value"
              nameKey="label"
              innerRadius="64%"
              outerRadius="100%"
              paddingAngle={total ? 1.5 : 0}
              stroke="#FFFDF9"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              onMouseLeave={() => setActive(null)}
            >
              {(total ? data : [{ key: "vazio" }]).map((d) => (
                <Cell
                  key={d.key}
                  fill={d.key === "vazio" ? "#EEE7DB" : CHART.status[d.key]}
                  opacity={active && active !== d.key ? 0.45 : 1}
                  onMouseEnter={() => setActive(d.key)}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-ink xl:text-2xl 2xl:text-3xl">{total}</span>
          <span className="text-xs text-stone-ink">{caption}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2.5" aria-label="Pedidos por status">
        {data.map((d, i) => {
          const pct = percents[i] ?? 0;
          return (
            <li
              key={d.key}
              onMouseEnter={() => setActive(d.key)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                active === d.key && "bg-linen",
              )}
            >
              <span className="size-3 shrink-0 rounded-[4px]" style={{ backgroundColor: CHART.status[d.key] }} />
              <span className="min-w-0 flex-1 truncate text-ink">{d.label}</span>
              <span className="w-9 shrink-0 text-right text-stone-ink tabular">{pct}%</span>
              <span className="w-7 shrink-0 text-right font-semibold text-ink tabular">{d.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Barras horizontais em HTML (série única, ordenadas): formas de pagamento, categorias.
export function HBarList({
  items,
  format = formatBRL,
  emptyLabel = "Sem dados no período.",
}: {
  items: { label: string; value: number; hint?: string }[];
  format?: (v: number) => string;
  emptyLabel?: string;
}) {
  const max = Math.max(0, ...items.map((i) => i.value));
  if (!items.length || max === 0) return <p className="py-6 text-center text-sm text-stone-ink">{emptyLabel}</p>;
  return (
    <ul className="space-y-3.5">
      {items.map((i) => (
        <li key={i.label} className="group">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink">{i.label}</span>
            <span className="font-semibold text-ink tabular">
              {format(i.value)}
              {i.hint ? <span className="ml-1.5 text-xs font-normal text-stone-ink">{i.hint}</span> : null}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[#F1EBE1]">
            <div
              className="h-full rounded-full bg-olive transition-colors group-hover:bg-olive-deep"
              style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
