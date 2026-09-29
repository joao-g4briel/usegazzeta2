import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/errors";
import { toCents, toNumber } from "@/lib/money";
import type { CustomerInput } from "@/lib/validations/admin";

export type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  cpf: string | null;
  ordersCount: number;
  salesCount: number;
  purchases: number;
  totalSpent: number;
  averageTicket: number;
  lastPurchase: string | null;
  createdAt: string;
};

/** Compras = pedidos online não cancelados + vendas presenciais concluídas. */
export async function listCustomers(params: { storeId: string; q?: string | null }): Promise<CustomerRow[]> {
  const q = params.q?.trim();
  const digits = q?.replace(/\D/g, "");
  const customers = await prisma.customer.findMany({
    where: {
      storeId: params.storeId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              ...(digits && digits.length >= 3
                ? [{ phone: { contains: digits } }, { whatsapp: { contains: digits } }, { cpf: { contains: digits } }]
                : []),
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const ids = customers.map((c) => c.id);
  const [orders, sales] = await Promise.all([
    prisma.order.groupBy({
      by: ["customerId"],
      where: { customerId: { in: ids }, orderStatus: { not: "CANCELADO" } },
      _count: { _all: true },
      _sum: { total: true },
      _max: { createdAt: true },
    }),
    prisma.sale.groupBy({
      by: ["customerId"],
      where: { customerId: { in: ids }, status: "COMPLETED" },
      _count: { _all: true },
      _sum: { total: true },
      _max: { createdAt: true },
    }),
  ]);

  return customers
    .map((c) => {
      const o = orders.find((x) => x.customerId === c.id);
      const s = sales.find((x) => x.customerId === c.id);
      const ordersCount = o?._count._all ?? 0;
      const salesCount = s?._count._all ?? 0;
      const totalCents = toCents(o?._sum.total ?? 0) + toCents(s?._sum.total ?? 0);
      const purchases = ordersCount + salesCount;
      const dates = [o?._max.createdAt, s?._max.createdAt].filter((d): d is Date => Boolean(d));
      const last = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        whatsapp: c.whatsapp,
        cpf: c.cpf,
        ordersCount,
        salesCount,
        purchases,
        totalSpent: totalCents / 100,
        averageTicket: purchases ? Math.round(totalCents / purchases) / 100 : 0,
        lastPurchase: last?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      };
    })
    .sort((a, b) => (b.lastPurchase ?? "").localeCompare(a.lastPurchase ?? ""));
}

export async function getCustomerProfile(storeId: string, id: string) {
  const c = await prisma.customer.findFirst({
    where: { id, storeId },
    include: {
      addresses: { orderBy: { createdAt: "desc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      sales: {
        orderBy: { createdAt: "desc" },
        include: { items: true, payments: { select: { method: true } } },
      },
    },
  });
  if (!c) return null;

  const products = new Map<string, { productName: string; variantLabel: string; quantity: number; total: number }>();
  const addItem = (i: { variantId: string; productName: string; variantLabel: string; quantity: number; subtotal: { toString(): string } }) => {
    const current = products.get(i.variantId) ?? {
      productName: i.productName,
      variantLabel: i.variantLabel,
      quantity: 0,
      total: 0,
    };
    current.quantity += i.quantity;
    current.total = Math.round((current.total + toNumber(i.subtotal)) * 100) / 100;
    products.set(i.variantId, current);
  };
  c.orders.filter((o) => o.orderStatus !== "CANCELADO").forEach((o) => o.items.forEach(addItem));
  c.sales.filter((s) => s.status === "COMPLETED").forEach((s) => s.items.forEach(addItem));

  const validOrders = c.orders.filter((o) => o.orderStatus !== "CANCELADO");
  const validSales = c.sales.filter((s) => s.status === "COMPLETED");
  const totalCents =
    validOrders.reduce((s, o) => s + toCents(o.total), 0) + validSales.reduce((s, x) => s + toCents(x.total), 0);
  const purchases = validOrders.length + validSales.length;

  const history = [
    ...c.orders.map((o) => ({
      kind: "order" as const,
      id: o.id,
      number: o.number,
      status: o.orderStatus as string,
      total: toNumber(o.total),
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      createdAt: o.createdAt.toISOString(),
    })),
    ...c.sales.map((s) => ({
      kind: "sale" as const,
      id: s.id,
      number: s.number,
      status: s.status as string,
      total: toNumber(s.total),
      itemCount: s.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: s.createdAt.toISOString(),
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    whatsapp: c.whatsapp,
    cpf: c.cpf,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    addresses: c.addresses,
    totalSpent: totalCents / 100,
    purchases,
    ordersCount: validOrders.length,
    salesCount: validSales.length,
    averageTicket: purchases ? Math.round(totalCents / purchases) / 100 : 0,
    lastPurchase: history[0]?.createdAt ?? null,
    history,
    products: [...products.values()].sort((a, b) => b.quantity - a.quantity),
  };
}

export type CustomerProfile = NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>;

export async function searchCustomers(storeId: string, q: string) {
  const term = q.trim();
  if (term.length < 2) return [];
  const digits = term.replace(/\D/g, "");
  const rows = await prisma.customer.findMany({
    where: {
      storeId,
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        ...(digits.length >= 3 ? [{ phone: { contains: digits } }, { whatsapp: { contains: digits } }] : []),
      ],
    },
    select: { id: true, name: true, whatsapp: true, phone: true, email: true },
    take: 8,
    orderBy: { name: "asc" },
  });
  return rows;
}

export async function createCustomer(storeId: string, input: CustomerInput) {
  if (input.email) {
    const exists = await prisma.customer.findFirst({ where: { storeId, email: input.email } });
    if (exists) throw new DomainError("Já existe uma cliente com este e-mail.", "DUPLICATE", "email");
  }
  return prisma.customer.create({
    data: { storeId, ...input },
    select: { id: true, name: true, whatsapp: true, phone: true, email: true },
  });
}

export async function updateCustomer(storeId: string, id: string, input: CustomerInput) {
  const existing = await prisma.customer.findFirst({ where: { id, storeId } });
  if (!existing) throw new DomainError("Cliente não encontrada.", "NOT_FOUND");
  if (input.email) {
    const clash = await prisma.customer.findFirst({ where: { storeId, email: input.email, id: { not: id } } });
    if (clash) throw new DomainError("Já existe uma cliente com este e-mail.", "DUPLICATE", "email");
  }
  return prisma.customer.update({ where: { id }, data: input });
}
