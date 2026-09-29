import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { AdminSearch } from "@/components/admin/admin-search";
import { CustomerDialog } from "@/components/admin/customer-form";
import { EmptyState } from "@/components/shared/misc";
import { maskPhone } from "@/components/shared/field";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { requirePageUser } from "@/lib/session";
import { listCustomers } from "@/services/customer-service";

export const metadata: Metadata = { title: "Clientes" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/clientes">) {
  const user = await requirePageUser("customers");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const customers = await listCustomers({ storeId: user.storeId, q });

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Clientes"
        description="Quem compra online e na loja, com histórico e ticket médio."
        actions={
          <CustomerDialog
            trigger={
              <Button>
                <UserPlus /> Nova cliente
              </Button>
            }
          />
        }
      />
      <div className="mb-5 flex justify-end">
        <AdminSearch placeholder="Nome, WhatsApp, e-mail ou CPF" basePath="/admin/clientes" />
      </div>
      {customers.length ? (
        <div className="relative overflow-x-auto rounded-2xl border border-hairline bg-paper shadow-soft">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs text-stone-ink">
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-3 py-3 font-semibold">WhatsApp</th>
                <th className="px-3 py-3 text-right font-semibold">Pedidos online</th>
                <th className="px-3 py-3 text-right font-semibold">Compras na loja</th>
                <th className="px-3 py-3 text-right font-semibold">Total gasto</th>
                <th className="px-3 py-3 text-right font-semibold">Ticket médio</th>
                <th className="px-3 py-3 font-semibold">Última compra</th>
                <th className="px-5 py-3"><span className="sr-only">Abrir</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-offwhite">
                  <td className="px-5 py-3">
                    <Link href={`/admin/clientes/${c.id}`} className="font-semibold hover:text-olive">
                      {c.name}
                    </Link>
                    <span className="block text-xs text-stone-ink">{c.email ?? "sem e-mail"}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap tabular">{c.whatsapp ? maskPhone(c.whatsapp) : "—"}</td>
                  <td className="px-3 py-3 text-right tabular">{c.ordersCount}</td>
                  <td className="px-3 py-3 text-right tabular">{c.salesCount}</td>
                  <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular">{formatBRL(c.totalSpent)}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap tabular">{c.purchases ? formatBRL(c.averageTicket) : "—"}</td>
                  <td className="px-3 py-3 text-stone-ink tabular">{c.lastPurchase ? formatDate(c.lastPurchase) : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/clientes/${c.id}`} aria-label={`Abrir ${c.name}`} className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-linen">
                      <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={<Users />} title="Nenhuma cliente encontrada" description="Clientes são criadas no checkout online, no PDV ou aqui." />
      )}
    </div>
  );
}
