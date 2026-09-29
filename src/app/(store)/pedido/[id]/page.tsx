import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MessageCircle, Package, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shared/product-image";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getPublicStore } from "@/services/store-service";
import { getPublicOrder } from "@/services/order-service";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };

export default async function OrderPage({ params }: PageProps<"/pedido/[id]">) {
  const { id } = await params;
  const store = await getPublicStore();
  const order = await getPublicOrder(store.id, id);
  if (!order) notFound();

  const canceled = order.orderStatus === "CANCELADO";
  const stepIndex = ORDER_STATUS_FLOW.indexOf(order.orderStatus);
  const whatsapp = store.whatsapp?.replace(/\D/g, "");
  const waText = encodeURIComponent(
    `Olá! Fiz o pedido #${order.number} (${formatBRL(order.total)}) no site da Use Gazzeta.`,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 pb-20 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <span
          className={cn(
            "flex size-16 items-center justify-center rounded-full",
            canceled ? "bg-rose-mist text-rose-deep" : "animate-pop-in bg-olive text-offwhite",
          )}
        >
          {canceled ? <Package className="size-7" /> : <Check className="size-8" strokeWidth={2.2} />}
        </span>
        <h1 className="mt-5 font-serif text-[2.4rem] leading-tight font-medium sm:text-[3rem]">
          {canceled ? "Pedido cancelado" : `Obrigada, ${order.customerName.split(" ")[0]}!`}
        </h1>
        <p className="mt-2 text-sm font-semibold text-olive tabular">Pedido #{order.number}</p>
        <p className="mt-3 max-w-md text-stone-ink">
          {canceled
            ? "Este pedido foi cancelado e as peças voltaram para a loja."
            : order.paymentStatus === "PAID"
              ? "Pagamento confirmado. Estamos cuidando do seu pedido."
              : `Recebemos seu pedido e as peças já estão reservadas. A loja vai confirmar o pagamento por ${PAYMENT_METHOD_LABELS[order.paymentMethod]} com você.`}
        </p>
        {whatsapp && !canceled ? (
          <Button asChild variant="outline" className="mt-6">
            <a href={`https://wa.me/${whatsapp.startsWith("55") ? whatsapp : `55${whatsapp}`}?text=${waText}`} target="_blank" rel="noreferrer">
              <MessageCircle /> Falar com a loja no WhatsApp
            </a>
          </Button>
        ) : null}
      </div>

      {!canceled ? (
        <ol className="mt-12 grid grid-cols-5 gap-2" aria-label="Andamento do pedido">
          {ORDER_STATUS_FLOW.map((status, i) => (
            <li key={status} className="flex flex-col items-center gap-2 text-center">
              <span className={cn("h-1.5 w-full rounded-full", i <= stepIndex ? "bg-olive" : "bg-beige")} />
              <span className={cn("text-[0.7rem] leading-tight sm:text-xs", i <= stepIndex ? "font-semibold text-ink" : "text-stone-ink")}>
                {ORDER_STATUS_LABELS[status]}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <section className="mt-12 rounded-3xl bg-cream p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-ink">
          <span>Feito em {formatDateTime(order.createdAt)}</span>
          <span className="inline-flex items-center gap-1.5">
            {order.shippingMethod === "RETIRADA" ? <Store className="size-4" /> : <Truck className="size-4" />}
            {order.shippingMethod === "RETIRADA" ? "Retirada na loja" : "Entrega"}
          </span>
        </div>
        <ul className="mt-5 divide-y divide-hairline">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <ProductImage
                src={item.image}
                alt={item.productName}
                kind={item.variantKind}
                monogram={false}
                sizes="64px"
                className="aspect-[4/5] w-14 shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-stone-ink">{item.variantLabel}</p>
              </div>
              <p className="text-sm tabular">
                {item.quantity} × {formatBRL(item.unitPrice)}
              </p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-hairline pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-stone-ink">Subtotal</dt><dd className="tabular">{formatBRL(order.subtotal)}</dd></div>
          {order.discount > 0 ? (
            <div className="flex justify-between text-olive"><dt>Desconto</dt><dd className="tabular">− {formatBRL(order.discount)}</dd></div>
          ) : null}
          <div className="flex justify-between"><dt className="text-stone-ink">Frete</dt><dd className="tabular">{order.shipping ? formatBRL(order.shipping) : "Grátis"}</dd></div>
          <div className="flex items-baseline justify-between pt-2"><dt className="font-serif text-xl font-semibold">Total</dt><dd className="text-xl font-bold tabular">{formatBRL(order.total)}</dd></div>
        </dl>
        {order.address ? (
          <p className="mt-5 text-sm text-stone-ink">
            Entrega em {order.address.street}, {order.address.number}
            {order.address.complement ? ` — ${order.address.complement}` : ""}, {order.address.city}/{order.address.state}
          </p>
        ) : null}
      </section>

      <div className="mt-8 text-center">
        <Button asChild variant="soft">
          <Link href="/produtos">Continuar comprando</Link>
        </Button>
      </div>
    </div>
  );
}
