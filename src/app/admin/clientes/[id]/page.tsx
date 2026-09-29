import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Pencil, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { CustomerDialog } from "@/components/admin/customer-form";
import { OrderStatusBadge, SaleStatusBadge } from "@/components/admin/badges";
import { maskCpf, maskPhone } from "@/components/shared/field";
import { formatBRL } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { OrderStatus } from "@/lib/constants";
import { requirePageUser } from "@/lib/session";
import { getCustomerProfile } from "@/services/customer-service";

export const metadata: Metadata = { title: "Cliente" };

export default async function CustomerPage({ params }: PageProps<"/admin/clientes/[id]">) {
  const user = await requirePageUser("customers");
  const { id } = await params;
  const c = await getCustomerProfile(user.storeId, id);
  if (!c) notFound();
  const wa = c.whatsapp?.replace(/\D/g, "");

  const stats = [
    { label: "Total gasto", value: formatBRL(c.totalSpent) },
    { label: "Compras", value: String(c.purchases), hint: `${c.ordersCount} online · ${c.salesCount} na loja` },
    { label: "Ticket médio", value: c.purchases ? formatBRL(c.averageTicket) : "—" },
    { label: "Última compra", value: c.lastPurchase ? formatDate(c.lastPurchase) : "—" },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        back={{ href: "/admin/clientes", label: "Clientes" }}
        title={c.name}
        description={`Cliente desde ${formatDate(c.createdAt)}`}
        actions={
          <>
            {wa ? (
              <Button asChild variant="soft">
                <a href={`https://wa.me/55${wa}`} target="_blank" rel="noreferrer">
                  <MessageCircle /> WhatsApp
                </a>
              </Button>
            ) : null}
            <CustomerDialog
              customer={c}
              trigger={
                <Button variant="outline">
                  <Pencil /> Editar
                </Button>
              }
            />
          </>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-hairline bg-paper p-4 shadow-soft">
            <p className="text-sm text-stone-ink">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            {s.hint ? <p className="text-xs text-stone-ink">{s.hint}</p> : null}
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Histórico" bodyClassName="pt-3">
          {c.history.length ? (
            <ul className="divide-y divide-hairline">
              {c.history.map((h) => (
                <li key={`${h.kind}-${h.id}`}>
                  <Link href={h.kind === "order" ? `/admin/pedidos/${h.id}` : `/admin/vendas/${h.id}`} className="flex items-center gap-3 py-3 hover:bg-offwhite">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {h.kind === "order" ? "Pedido online" : "Venda na loja"} #{h.number}
                      </p>
                      <p className="text-xs text-stone-ink tabular">
                        {formatDateTime(h.createdAt)} · {h.itemCount} {h.itemCount === 1 ? "item" : "itens"}
                      </p>
                    </div>
                    {h.kind === "order" ? (
                      <OrderStatusBadge status={h.status as OrderStatus} className="h-6 px-2 text-[0.68rem]" />
                    ) : (
                      <SaleStatusBadge status={h.status as "COMPLETED" | "CANCELED"} />
                    )}
                    <span className="w-24 text-right font-semibold tabular">{formatBRL(h.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-stone-ink">Nenhuma compra ainda.</p>
          )}
        </Panel>
        <div className="space-y-5">
          <Panel title="Dados">
            <ul className="space-y-2.5 text-sm">
              {c.whatsapp ? <li className="flex items-center gap-2"><MessageCircle className="size-4 text-olive" /> {maskPhone(c.whatsapp)}</li> : null}
              {c.phone ? <li className="flex items-center gap-2"><Phone className="size-4 text-olive" /> {maskPhone(c.phone)}</li> : null}
              {c.email ? <li className="flex items-center gap-2"><Mail className="size-4 text-olive" /> {c.email}</li> : null}
              {c.cpf ? <li className="text-stone-ink">CPF {maskCpf(c.cpf)}</li> : null}
              {c.addresses[0] ? (
                <li className="text-stone-ink">
                  {c.addresses[0].street}, {c.addresses[0].number} · {c.addresses[0].city}/{c.addresses[0].state}
                </li>
              ) : null}
            </ul>
            {c.notes ? <p className="mt-3 rounded-xl bg-offwhite px-3 py-2 text-sm">{c.notes}</p> : null}
          </Panel>
          <Panel title="Produtos comprados" bodyClassName="pt-3">
            {c.products.length ? (
              <ul className="divide-y divide-hairline text-sm">
                {c.products.slice(0, 12).map((p) => (
                  <li key={`${p.productName}-${p.variantLabel}`} className="flex justify-between gap-3 py-2">
                    <span>
                      {p.productName} <span className="text-stone-ink">· {p.variantLabel}</span>
                    </span>
                    <span className="text-stone-ink tabular">{p.quantity}×</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-stone-ink">—</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
