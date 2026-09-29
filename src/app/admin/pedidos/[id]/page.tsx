import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, MessageCircle, Phone, Store, Truck } from "lucide-react";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/badges";
import { OrderStatusControl } from "@/components/admin/order-actions";
import { ProductImage } from "@/components/shared/product-image";
import { maskPhone } from "@/components/shared/field";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { MOVEMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { requirePageUser } from "@/lib/session";
import { getOrder } from "@/services/order-service";

export const metadata: Metadata = { title: "Pedido" };

export default async function OrderDetailPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const user = await requirePageUser("orders");
  const { id } = await params;
  const order = await getOrder(user.storeId, id);
  if (!order) notFound();
  const wa = (order.customer.whatsapp ?? order.customer.phone)?.replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        back={{ href: "/admin/pedidos", label: "Pedidos" }}
        title={`Pedido #${order.number}`}
        description={`Feito em ${formatDateTime(order.createdAt)} · atualizado em ${formatDateTime(order.updatedAt)}`}
        actions={<OrderStatusBadge status={order.orderStatus} className="h-9 px-4 text-sm" />}
      />
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Panel title="Andamento">
            <OrderStatusControl orderId={order.id} status={order.orderStatus} />
          </Panel>
          <Panel title="Itens" bodyClassName="pt-3">
            <ul className="divide-y divide-hairline">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <ProductImage src={i.image} alt={i.productName} kind={i.variantKind} monogram={false} sizes="56px" className="aspect-[4/5] w-14 shrink-0 rounded-lg" artClassName="h-[80%]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{i.productName}</p>
                    <p className="text-sm text-stone-ink">
                      {i.variantLabel} · SKU {i.sku}
                    </p>
                    <Link href={`/admin/estoque/movimentacoes?variante=${i.variantId}`} className="text-xs font-semibold text-olive hover:underline">
                      Estoque atual: {i.currentStock}
                    </Link>
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
            <dl className="mt-3 space-y-1.5 border-t border-hairline pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-stone-ink">Subtotal</dt><dd className="tabular">{formatBRL(order.subtotal)}</dd></div>
              {order.discount ? (
                <div className="flex justify-between"><dt className="text-stone-ink">Desconto {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd className="tabular">− {formatBRL(order.discount)}</dd></div>
              ) : null}
              <div className="flex justify-between"><dt className="text-stone-ink">Frete</dt><dd className="tabular">{order.shipping ? formatBRL(order.shipping) : "Grátis"}</dd></div>
              <div className="flex justify-between pt-1 text-base"><dt className="font-semibold">Total</dt><dd className="font-bold tabular">{formatBRL(order.total)}</dd></div>
            </dl>
          </Panel>
          {order.movements.length ? (
            <Panel title="Movimentações de estoque">
              <ul className="space-y-2 text-sm">
                {order.movements.map((m) => {
                  const item = order.items.find((i) => i.variantId === m.variantId);
                  return (
                    <li key={m.id} className="flex flex-wrap justify-between gap-2">
                      <span>
                        <strong>{MOVEMENT_TYPE_LABELS[m.type]}</strong> · {item?.productName} {item?.variantLabel}
                      </span>
                      <span className="text-stone-ink tabular">
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} · {formatDateTime(m.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}
        </div>
        <div className="space-y-5">
          <Panel title="Cliente">
            <Link href={`/admin/clientes/${order.customer.id}`} className="font-semibold hover:text-olive">
              {order.customer.name}
            </Link>
            <ul className="mt-3 space-y-2 text-sm text-stone-ink">
              {order.customer.email ? <li className="flex items-center gap-2"><Mail className="size-4" /> {order.customer.email}</li> : null}
              {order.customer.phone ? <li className="flex items-center gap-2"><Phone className="size-4" /> {maskPhone(order.customer.phone)}</li> : null}
            </ul>
            {wa ? (
              <a
                href={`https://wa.me/55${wa}?text=${encodeURIComponent(`Olá, ${order.customer.name.split(" ")[0]}! Aqui é da Use Gazzeta, sobre o seu pedido #${order.number}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-sage-light px-4 text-sm font-semibold text-secondary-foreground"
              >
                <MessageCircle className="size-4" /> Chamar no WhatsApp
              </a>
            ) : null}
          </Panel>
          <Panel title="Pagamento">
            <p className="flex items-center justify-between text-sm">
              <span>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
              <PaymentStatusBadge status={order.paymentStatus} />
            </p>
            <p className="mt-2 text-xs text-stone-ink">
              Sem gateway integrado: confirme o recebimento e avance o pedido para “Pago”.
            </p>
          </Panel>
          <Panel title={order.shippingMethod === "RETIRADA" ? "Retirada" : "Entrega"}>
            {order.shippingMethod === "RETIRADA" ? (
              <p className="flex items-center gap-2 text-sm"><Store className="size-4 text-olive" /> Cliente retira na loja</p>
            ) : order.address ? (
              <p className="flex gap-2 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-olive" />
                <span>
                  {order.address.street}, {order.address.number}
                  {order.address.complement ? ` — ${order.address.complement}` : ""}
                  <br />
                  {order.address.district ? `${order.address.district} · ` : ""}
                  {order.address.city}/{order.address.state} · CEP {order.address.zipCode.replace(/(\d{5})(\d{3})/, "$1-$2")}
                </span>
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm"><Truck className="size-4" /> Endereço não informado</p>
            )}
            {order.notes ? <p className="mt-3 rounded-xl bg-offwhite px-3 py-2 text-sm">“{order.notes}”</p> : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}
