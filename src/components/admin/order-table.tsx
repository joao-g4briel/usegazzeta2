import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { ProductImage } from "@/components/shared/product-image";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/badges";
import type { OrderListItem } from "@/types/catalog";

function Thumbs({ items, more }: { items: OrderListItem["itemThumbs"]; more: number }) {
  return (
    <div className="flex items-center -space-x-2">
      {items.map((t, i) => (
        <ProductImage
          key={i}
          src={t.image}
          alt={t.name}
          kind={t.variantKind}
          monogram={false}
          sizes="36px"
          className="size-9 rounded-lg ring-2 ring-paper"
          artClassName="h-[80%]"
        />
      ))}
      {more > 0 ? (
        <span className="flex size-9 items-center justify-center rounded-lg bg-linen text-xs font-semibold text-stone-ink ring-2 ring-paper">
          +{more}
        </span>
      ) : null}
    </div>
  );
}

export function OrderTable({ orders, compact }: { orders: OrderListItem[]; compact?: boolean }) {
  return (
    <>
      {/* Tabela no desktop */}
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs font-semibold text-stone-ink">
              <th className="py-3 pr-3 font-semibold">Pedido</th>
              <th className="py-3 pr-3 font-semibold">Cliente</th>
              <th className={compact ? "hidden py-3 pr-3 font-semibold 2xl:table-cell" : "py-3 pr-3 font-semibold"}>Itens</th>
              <th className="py-3 pr-3 text-right font-semibold">Valor</th>
              <th className="py-3 pr-3 font-semibold">Status</th>
              {!compact ? <th className="py-3 pr-3 font-semibold">Pagamento</th> : null}
              <th className="py-3 pr-3 font-semibold">Data</th>
              <th className="py-3 font-semibold"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {orders.map((o) => (
              <tr key={o.id} className="group hover:bg-offwhite">
                <td className="py-3 pr-3 font-semibold tabular">#{o.number}</td>
                <td className="py-3 pr-3 whitespace-nowrap">
                  <Link href={`/admin/clientes/${o.customerId}`} className="hover:text-olive">
                    {o.customerName}
                  </Link>
                </td>
                <td className={compact ? "hidden py-3 pr-3 2xl:table-cell" : "py-3 pr-3"}>
                  <Thumbs items={o.itemThumbs} more={o.itemCount - o.itemThumbs.length} />
                </td>
                <td className="py-3 pr-3 text-right font-semibold whitespace-nowrap tabular">{formatBRL(o.total)}</td>
                <td className="py-3 pr-3">
                  <OrderStatusBadge status={o.orderStatus} />
                </td>
                {!compact ? (
                  <td className="py-3 pr-3">
                    <span className="block text-xs text-stone-ink">{PAYMENT_METHOD_LABELS[o.paymentMethod]}</span>
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </td>
                ) : null}
                <td className="py-3 pr-3 whitespace-nowrap text-stone-ink tabular">{formatDateTime(o.createdAt)}</td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    aria-label={`Abrir pedido #${o.number}`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-olive hover:bg-sage-mist"
                  >
                    {compact ? null : "Abrir"} <ChevronRight className="size-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista no celular */}
      <ul className="divide-y divide-hairline md:hidden">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-3 py-3.5">
              <Thumbs items={o.itemThumbs.slice(0, 2)} more={0} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  #{o.number} · {o.customerName}
                </p>
                <p className="text-xs text-stone-ink tabular">{formatDateTime(o.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold tabular">{formatBRL(o.total)}</span>
                <OrderStatusBadge status={o.orderStatus} className="h-6 px-2 text-[0.68rem]" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
