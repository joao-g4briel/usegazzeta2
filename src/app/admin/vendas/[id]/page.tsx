import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { SaleStatusBadge } from "@/components/admin/badges";
import { CancelSaleButton } from "@/components/admin/order-actions";
import { ProductImage } from "@/components/shared/product-image";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { requirePageUser } from "@/lib/session";
import { getSale } from "@/services/sale-service";

export const metadata: Metadata = { title: "Venda presencial" };

export default async function SaleDetailPage({ params }: PageProps<"/admin/vendas/[id]">) {
  const user = await requirePageUser("orders");
  const { id } = await params;
  const sale = await getSale(user.storeId, id);
  if (!sale) notFound();

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        back={{ href: "/admin/pedidos?canal=loja", label: "Vendas presenciais" }}
        title={`Venda #${sale.number}`}
        description={`PDV · ${formatDateTime(sale.createdAt)}${sale.sellerName ? ` · por ${sale.sellerName}` : ""}`}
        actions={
          <>
            <SaleStatusBadge status={sale.status} />
            {sale.status === "COMPLETED" ? <CancelSaleButton saleId={sale.id} /> : null}
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Itens" bodyClassName="pt-3">
          <ul className="divide-y divide-hairline">
            {sale.items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-3">
                <ProductImage src={i.image} alt={i.productName} kind={i.variantKind} monogram={false} sizes="56px" className="aspect-[4/5] w-14 shrink-0 rounded-lg" artClassName="h-[80%]" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{i.productName}</p>
                  <p className="text-sm text-stone-ink">
                    {i.variantLabel} · SKU {i.sku}
                  </p>
                </div>
                <div className="text-right tabular">
                  <p className="text-xs text-stone-ink">
                    {i.quantity} × {formatBRL(i.unitPrice)}
                  </p>
                  <p className="font-semibold">{formatBRL(i.subtotal)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="space-y-5">
          <Panel title="Resumo">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-stone-ink">Subtotal</dt><dd className="tabular">{formatBRL(sale.subtotal)}</dd></div>
              {sale.discount ? (
                <div className="flex justify-between">
                  <dt className="text-stone-ink">Desconto{sale.couponCode ? ` (${sale.couponCode})` : ""}</dt>
                  <dd className="tabular">− {formatBRL(sale.discount)}</dd>
                </div>
              ) : null}
              {sale.discountReason ? <p className="text-xs text-stone-ink">Motivo: {sale.discountReason}</p> : null}
              <div className="flex justify-between border-t border-hairline pt-2 text-base"><dt className="font-semibold">Total</dt><dd className="font-bold tabular">{formatBRL(sale.total)}</dd></div>
            </dl>
          </Panel>
          <Panel title="Pagamento">
            <ul className="space-y-2 text-sm">
              {sale.payments.map((p) => (
                <li key={p.id}>
                  <p className="flex justify-between">
                    <span>
                      {PAYMENT_METHOD_LABELS[p.method]}
                      {p.installments && p.installments > 1 ? ` · ${p.installments}x` : ""}
                    </span>
                    <span className="font-semibold tabular">{formatBRL(p.amount)}</span>
                  </p>
                  {p.receivedAmount !== null ? (
                    <p className="text-xs text-stone-ink tabular">
                      Recebido {formatBRL(p.receivedAmount)} · troco {formatBRL(p.changeAmount ?? 0)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Cliente">
            {sale.customer ? (
              <Link href={`/admin/clientes/${sale.customer.id}`} className="font-semibold hover:text-olive">
                {sale.customer.name}
              </Link>
            ) : (
              <p className="text-sm text-stone-ink">Venda sem cliente identificada.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
