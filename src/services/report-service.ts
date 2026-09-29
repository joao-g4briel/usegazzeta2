import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/money";
import { variantLabel } from "@/lib/variant";
import {
  addDays,
  addMonths,
  periodRange,
  startOfStoreDay,
  startOfStoreMonth,
  storeDayKey,
  storeMonthKey,
  type PeriodKey,
} from "@/lib/dates";
import { STORE_UTC_OFFSET_HOURS, type OrderStatus, type PaymentMethod } from "@/lib/constants";
import { listLowStockVariants } from "@/services/inventory-service";
import { listOrders } from "@/services/order-service";

// Faturamento = mercadoria líquida de desconto (sem frete):
//   PDV: vendas concluídas · Online: pedidos pagos e não cancelados.

const OFFSET = Prisma.raw(`interval '${-STORE_UTC_OFFSET_HOURS} hours'`);

function ts(date: Date) {
  // created_at é timestamp sem fuso gravado em UTC.
  return Prisma.sql`(${date.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
}

type Bucket = "hour" | "day" | "month";

function bucketExpr(bucket: Bucket, column: string) {
  const col = Prisma.raw(column);
  if (bucket === "hour") return Prisma.sql`to_char(${col} - ${OFFSET}, 'HH24')`;
  if (bucket === "month") return Prisma.sql`to_char(${col} - ${OFFSET}, 'YYYY-MM')`;
  return Prisma.sql`to_char(${col} - ${OFFSET}, 'YYYY-MM-DD')`;
}

type SeriesRow = { k: string; revenue: number; n: number };

async function revenueSeries(storeId: string, from: Date, to: Date, bucket: Bucket) {
  const [sales, orders] = await Promise.all([
    prisma.$queryRaw<SeriesRow[]>`
      SELECT ${bucketExpr(bucket, "created_at")} AS k, COALESCE(SUM(total), 0)::float AS revenue, COUNT(*)::int AS n
      FROM sales
      WHERE store_id = ${storeId} AND status = 'COMPLETED'
        AND created_at >= ${ts(from)} AND created_at < ${ts(to)}
      GROUP BY 1`,
    prisma.$queryRaw<SeriesRow[]>`
      SELECT ${bucketExpr(bucket, "created_at")} AS k, COALESCE(SUM(subtotal - discount), 0)::float AS revenue, COUNT(*)::int AS n
      FROM orders
      WHERE store_id = ${storeId} AND payment_status = 'PAID' AND order_status <> 'CANCELADO'
        AND created_at >= ${ts(from)} AND created_at < ${ts(to)}
      GROUP BY 1`,
  ]);
  return { sales, orders };
}

function bucketKeys(from: Date, to: Date, bucket: Bucket): string[] {
  const keys: string[] = [];
  if (bucket === "hour") {
    for (let h = 0; h < 24; h++) keys.push(String(h).padStart(2, "0"));
  } else if (bucket === "month") {
    for (let d = startOfStoreMonth(from); d < to; d = addMonths(d, 1)) keys.push(storeMonthKey(d));
  } else {
    for (let d = startOfStoreDay(from); d < to; d = addDays(d, 1)) keys.push(storeDayKey(d));
  }
  return keys;
}

export type SeriesPoint = { key: string; online: number; store: number; total: number; count: number };

async function buildSeries(storeId: string, from: Date, to: Date, bucket: Bucket): Promise<SeriesPoint[]> {
  const { sales, orders } = await revenueSeries(storeId, from, to, bucket);
  return bucketKeys(from, to, bucket).map((key) => {
    const s = sales.find((r) => r.k === key);
    const o = orders.find((r) => r.k === key);
    const store = Math.round((s?.revenue ?? 0) * 100) / 100;
    const online = Math.round((o?.revenue ?? 0) * 100) / 100;
    return {
      key,
      store,
      online,
      total: Math.round((store + online) * 100) / 100,
      count: (s?.n ?? 0) + (o?.n ?? 0),
    };
  });
}

async function totalsBetween(storeId: string, from: Date, to: Date) {
  const [sales, orders] = await Promise.all([
    prisma.sale.aggregate({
      where: { storeId, status: "COMPLETED", createdAt: { gte: from, lt: to } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: {
        storeId,
        paymentStatus: "PAID",
        orderStatus: { not: "CANCELADO" },
        createdAt: { gte: from, lt: to },
      },
      select: { subtotal: true, discount: true, shipping: true },
    }),
  ]);
  const onlineCents = orders.reduce((s, o) => s + toCents(o.subtotal) - toCents(o.discount), 0);
  const storeCents = toCents(sales._sum.total ?? 0);
  return {
    storeRevenue: storeCents / 100,
    onlineRevenue: onlineCents / 100,
    revenue: (storeCents + onlineCents) / 100,
    shipping: orders.reduce((s, o) => s + toCents(o.shipping), 0) / 100,
    storeCount: sales._count._all,
    onlineCount: orders.length,
    count: sales._count._all + orders.length,
  };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// Donut: status agrupados como no painel.
export type StatusSlice = { key: "entregues" | "transporte" | "processando" | "cancelados"; label: string; value: number };

function groupStatuses(counts: { status: OrderStatus; n: number }[]): StatusSlice[] {
  const sum = (statuses: OrderStatus[]) =>
    counts.filter((c) => statuses.includes(c.status)).reduce((s, c) => s + c.n, 0);
  return [
    { key: "entregues", label: "Entregues", value: sum(["ENTREGUE"]) },
    { key: "transporte", label: "Em transporte", value: sum(["ENVIADO"]) },
    { key: "processando", label: "Processando", value: sum(["AGUARDANDO_PAGAMENTO", "PAGO", "EM_SEPARACAO"]) },
    { key: "cancelados", label: "Cancelados", value: sum(["CANCELADO"]) },
  ];
}

export async function getDashboard(storeId: string, period: PeriodKey) {
  const now = new Date();
  const today = startOfStoreDay(now);
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  const monthStart = startOfStoreMonth(now);
  const range = periodRange(period, now);
  const bucket: Bucket = period === "hoje" ? "hour" : period === "ano" ? "month" : "day";

  const [
    todayTotals,
    yesterdayTotals,
    productsCount,
    productsThisMonth,
    lowStockCount,
    outOfStockCount,
    series,
    statusRows,
    recentOrders,
    lowStock,
  ] = await Promise.all([
    totalsBetween(storeId, today, tomorrow),
    totalsBetween(storeId, yesterday, today),
    prisma.product.count({ where: { storeId, active: true } }),
    prisma.product.count({ where: { storeId, createdAt: { gte: monthStart } } }),
    prisma.productVariant.count({
      where: { active: true, product: { storeId }, stock: { lte: prisma.productVariant.fields.minimumStock } },
    }),
    prisma.productVariant.count({ where: { active: true, product: { storeId }, stock: { lte: 0 } } }),
    buildSeries(storeId, range.from, range.to, bucket),
    prisma.order.groupBy({
      by: ["orderStatus"],
      where: { storeId, createdAt: { gte: range.from, lt: range.to } },
      _count: { _all: true },
    }),
    listOrders({ storeId, take: 6 }),
    listLowStockVariants(storeId, 6),
  ]);

  // Pedidos de hoje: online (todos os criados) + vendas presenciais concluídas.
  const [ordersToday, ordersYesterday] = await Promise.all([
    prisma.order.count({ where: { storeId, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.order.count({ where: { storeId, createdAt: { gte: yesterday, lt: today } } }),
  ]);
  const purchasesToday = ordersToday + todayTotals.storeCount;
  const purchasesYesterday = ordersYesterday + yesterdayTotals.storeCount;

  const periodTotal = series.reduce((s, p) => s + p.total, 0);

  return {
    cards: {
      salesToday: todayTotals.revenue,
      salesChange: pctChange(todayTotals.revenue, yesterdayTotals.revenue),
      purchasesToday,
      purchasesOnlineToday: ordersToday,
      purchasesStoreToday: todayTotals.storeCount,
      purchasesChange: pctChange(purchasesToday, purchasesYesterday),
      productsCount,
      productsThisMonth,
      lowStockCount,
      outOfStockCount,
    },
    series,
    bucket,
    periodTotal: Math.round(periodTotal * 100) / 100,
    statuses: groupStatuses(statusRows.map((r) => ({ status: r.orderStatus, n: r._count._all }))),
    recentOrders,
    lowStock,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

// ─────────────────────────────────────────────── relatórios

type ItemAggRow = { variant_id: string; product_id: string; qty: number; revenue: number; cost: number };

async function itemAggregates(storeId: string, from: Date, to: Date) {
  return prisma.$queryRaw<ItemAggRow[]>`
    SELECT variant_id, product_id, SUM(quantity)::int AS qty,
           COALESCE(SUM(subtotal), 0)::float AS revenue,
           COALESCE(SUM(cost_price * quantity), 0)::float AS cost
    FROM (
      SELECT si.variant_id, si.product_id, si.quantity, si.subtotal, si.cost_price
      FROM sale_items si JOIN sales s ON s.id = si.sale_id
      WHERE s.store_id = ${storeId} AND s.status = 'COMPLETED'
        AND s.created_at >= ${ts(from)} AND s.created_at < ${ts(to)}
      UNION ALL
      SELECT oi.variant_id, oi.product_id, oi.quantity, oi.subtotal, oi.cost_price
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.store_id = ${storeId} AND o.payment_status = 'PAID' AND o.order_status <> 'CANCELADO'
        AND o.created_at >= ${ts(from)} AND o.created_at < ${ts(to)}
    ) t
    GROUP BY variant_id, product_id`;
}

type PaymentAggRow = { method: PaymentMethod; amount: number; n: number };

async function paymentAggregates(storeId: string, from: Date, to: Date) {
  return prisma.$queryRaw<PaymentAggRow[]>`
    SELECT p.method::text AS method, COALESCE(SUM(p.amount), 0)::float AS amount, COUNT(*)::int AS n
    FROM payments p
    LEFT JOIN sales s ON s.id = p.sale_id
    LEFT JOIN orders o ON o.id = p.order_id
    WHERE p.status = 'PAID'
      AND ((s.id IS NOT NULL AND s.store_id = ${storeId} AND s.status = 'COMPLETED'
            AND s.created_at >= ${ts(from)} AND s.created_at < ${ts(to)})
        OR (o.id IS NOT NULL AND o.store_id = ${storeId} AND o.order_status <> 'CANCELADO'
            AND o.created_at >= ${ts(from)} AND o.created_at < ${ts(to)}))
    GROUP BY 1
    ORDER BY 2 DESC`;
}

export async function getReport(storeId: string, from: Date, to: Date) {
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  const bucket: Bucket = days > 92 ? "month" : "day";
  const yearAgo = addMonths(startOfStoreMonth(new Date()), -11);

  const [totals, series, monthly, items, payments, stockOut, stockLow] = await Promise.all([
    totalsBetween(storeId, from, to),
    buildSeries(storeId, from, to, bucket),
    buildSeries(storeId, yearAgo, addDays(startOfStoreDay(new Date()), 1), "month"),
    itemAggregates(storeId, from, to),
    paymentAggregates(storeId, from, to),
    prisma.productVariant.findMany({
      where: { active: true, product: { storeId, active: true }, stock: { lte: 0 } },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.productVariant.findMany({
      where: {
        active: true,
        product: { storeId, active: true },
        stock: { gt: 0, lte: prisma.productVariant.fields.minimumStock },
      },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { stock: "asc" },
      take: 50,
    }),
  ]);

  const variantIds = items.map((i) => i.variant_id);
  const variants = variantIds.length
    ? await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          color: true,
          size: true,
          tone: true,
          volume: true,
          product: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
        },
      })
    : [];
  const byId = new Map(variants.map((v) => [v.id, v]));

  const topVariants = items
    .map((i) => {
      const v = byId.get(i.variant_id);
      return {
        variantId: i.variant_id,
        productId: i.product_id,
        productName: v?.product.name ?? "Produto removido",
        variantLabel: v ? variantLabel(v) : "—",
        quantity: i.qty,
        revenue: Math.round(i.revenue * 100) / 100,
      };
    })
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 10);

  const productMap = new Map<string, { productId: string; productName: string; quantity: number; revenue: number }>();
  const categoryMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const i of items) {
    const v = byId.get(i.variant_id);
    const p = productMap.get(i.product_id) ?? {
      productId: i.product_id,
      productName: v?.product.name ?? "Produto removido",
      quantity: 0,
      revenue: 0,
    };
    p.quantity += i.qty;
    p.revenue = Math.round((p.revenue + i.revenue) * 100) / 100;
    productMap.set(i.product_id, p);

    const catKey = v?.product.category.id ?? "none";
    const c = categoryMap.get(catKey) ?? { name: v?.product.category.name ?? "Sem categoria", quantity: 0, revenue: 0 };
    c.quantity += i.qty;
    c.revenue = Math.round((c.revenue + i.revenue) * 100) / 100;
    categoryMap.set(catKey, c);
  }

  const costCents = items.reduce((s, i) => s + Math.round(i.cost * 100), 0);
  const revenueCents = toCents(totals.revenue);

  return {
    summary: {
      revenue: totals.revenue,
      storeRevenue: totals.storeRevenue,
      onlineRevenue: totals.onlineRevenue,
      shipping: totals.shipping,
      count: totals.count,
      storeCount: totals.storeCount,
      onlineCount: totals.onlineCount,
      averageTicket: totals.count ? Math.round(revenueCents / totals.count) / 100 : 0,
      cost: costCents / 100,
      estimatedProfit: (revenueCents - costCents) / 100,
      margin: revenueCents ? Math.round(((revenueCents - costCents) / revenueCents) * 1000) / 10 : 0,
      itemsSold: items.reduce((s, i) => s + i.qty, 0),
    },
    bucket,
    series,
    monthly,
    topVariants,
    topProducts: [...productMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
    categories: [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue),
    payments: payments.map((p) => ({ method: p.method, amount: Math.round(p.amount * 100) / 100, count: p.n })),
    outOfStock: stockOut.map((v) => ({
      variantId: v.id,
      productId: v.product.id,
      productName: v.product.name,
      label: variantLabel(v),
      sku: v.sku,
      stock: v.stock,
      minimumStock: v.minimumStock,
    })),
    lowStock: stockLow.map((v) => ({
      variantId: v.id,
      productId: v.product.id,
      productName: v.product.name,
      label: variantLabel(v),
      sku: v.sku,
      stock: v.stock,
      minimumStock: v.minimumStock,
    })),
  };
}

export type ReportData = Awaited<ReturnType<typeof getReport>>;
