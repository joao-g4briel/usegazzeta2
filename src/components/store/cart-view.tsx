"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Store, TicketPercent, Trash2, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { swatchFor } from "@/lib/constants";
import { EmptyState } from "@/components/shared/misc";
import { ProductImage } from "@/components/shared/product-image";
import { useCart } from "@/components/store/cart-provider";
import { useCartQuote } from "@/components/store/use-cart-quote";
import type { CartQuote, CartQuoteLine } from "@/services/order-service";

const COUPON_KEY = "ug-cupom";
const SHIPPING_KEY = "ug-entrega";

export function readCheckoutPrefs(): { coupon: string | null; shipping: "ENTREGA" | "RETIRADA" } {
  try {
    return {
      coupon: sessionStorage.getItem(COUPON_KEY),
      shipping: sessionStorage.getItem(SHIPPING_KEY) === "RETIRADA" ? "RETIRADA" : "ENTREGA",
    };
  } catch {
    return { coupon: null, shipping: "ENTREGA" };
  }
}

function savePref(key: string, value: string | null) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // sem sessionStorage: a preferência vale só nesta tela
  }
}

function CartLineRow({ line, onQty, onRemove }: { line: CartQuoteLine; onQty: (q: number) => void; onRemove: () => void }) {
  const tint = swatchFor(line.details.find((d) => d.label === "Cor")?.value);
  return (
    <li className="flex gap-4 py-5">
      <Link href={`/produtos/${line.productSlug}`} className="shrink-0">
        <ProductImage
          src={line.image}
          alt={line.productName}
          kind={line.variantKind}
          tint={tint}
          monogram={false}
          sizes="120px"
          className="aspect-[4/5] w-24 rounded-xl sm:w-28"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/produtos/${line.productSlug}`} className="font-medium text-ink hover:text-olive">
              {line.productName}
            </Link>
            <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-stone-ink">
              {line.details.length
                ? line.details.map((d) => (
                    <span key={d.label}>
                      {d.label}: <span className="text-ink">{d.value}</span>
                    </span>
                  ))
                : <span>Padrão</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${line.productName} ${line.label}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-stone-ink hover:bg-linen hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        {line.issue ? (
          <p className="rounded-lg bg-rose-mist px-3 py-2 text-xs font-medium text-rose-deep">
            {line.issue === "unavailable"
              ? "Esgotou enquanto estava na sacola. Remova para continuar."
              : `Restam só ${line.stock} — ajustamos a quantidade.`}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="flex h-10 items-center rounded-xl border border-[#d9d0c1] bg-paper">
            <button
              type="button"
              aria-label="Diminuir"
              onClick={() => onQty(line.requested - 1)}
              className="inline-flex size-10 items-center justify-center"
            >
              {line.requested <= 1 ? <Trash2 className="size-4 text-stone-ink" /> : <Minus className="size-4" />}
            </button>
            <span className="w-7 text-center text-sm font-semibold tabular">{line.quantity}</span>
            <button
              type="button"
              aria-label="Aumentar"
              disabled={line.quantity >= line.stock}
              onClick={() => onQty(line.requested + 1)}
              className="inline-flex size-10 items-center justify-center disabled:text-stone/40"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="text-right tabular">
            <p className="text-xs text-stone-ink">
              {line.quantity} × {formatBRL(line.unitPrice)}
            </p>
            <p className="font-bold text-ink">{formatBRL(line.subtotal)}</p>
          </div>
        </div>
      </div>
    </li>
  );
}

export function Summary({
  quote,
  loading,
  couponApplied,
}: {
  quote: CartQuote | null;
  loading: boolean;
  couponApplied?: string | null;
}) {
  if (!quote) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  return (
    <dl className={cn("space-y-3 text-sm transition-opacity", loading && "opacity-60")}>
      <div className="flex justify-between">
        <dt className="text-stone-ink">
          Subtotal ({quote.itemCount} {quote.itemCount === 1 ? "item" : "itens"})
        </dt>
        <dd className="font-medium tabular">{formatBRL(quote.subtotal)}</dd>
      </div>
      {quote.discount > 0 ? (
        <div className="flex justify-between text-olive">
          <dt>Desconto {quote.coupon ? `· ${quote.coupon.code}` : couponApplied ? `· ${couponApplied}` : ""}</dt>
          <dd className="font-medium tabular">− {formatBRL(quote.discount)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between">
        <dt className="text-stone-ink">Frete</dt>
        <dd className="font-medium tabular">{quote.shipping > 0 ? formatBRL(quote.shipping) : "Grátis"}</dd>
      </div>
      {quote.freeShippingRemaining !== null && quote.shipping > 0 ? (
        <p className="rounded-lg bg-sage-mist px-3 py-2 text-xs text-olive">
          Faltam {formatBRL(quote.freeShippingRemaining)} para o frete grátis.
        </p>
      ) : null}
      <div className="flex items-baseline justify-between border-t border-hairline pt-4">
        <dt className="font-serif text-xl font-semibold">Total</dt>
        <dd className="text-2xl font-bold tabular">{formatBRL(quote.total)}</dd>
      </div>
    </dl>
  );
}

export function CartView() {
  const { lines, ready, setQuantity, remove } = useCart();
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [shipping, setShipping] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");

  useEffect(() => {
    const prefs = readCheckoutPrefs();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preferências salvas na sessão
    setCoupon(prefs.coupon);
    setCouponInput(prefs.coupon ?? "");
    setShipping(prefs.shipping);
  }, []);

  const { quote, loading } = useCartQuote(lines, ready, coupon, shipping);

  // Ajusta a sacola ao estoque real devolvido pelo servidor.
  useEffect(() => {
    if (!quote) return;
    for (const l of quote.lines) {
      if (l.issue === "reduced") setQuantity(l.variantId, l.quantity);
    }
  }, [quote, setQuantity]);

  if (ready && !lines.length) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="Sua sacola está vazia"
        description="Explore as novidades e escolha suas peças favoritas."
        action={
          <Button asChild>
            <Link href="/produtos">Ver produtos</Link>
          </Button>
        }
      />
    );
  }

  const blocked = quote?.lines.some((l) => l.issue === "unavailable") ?? true;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <section aria-label="Itens da sacola">
        {!quote ? (
          <div className="space-y-5">
            {lines.map((l) => (
              <div key={l.variantId} className="flex gap-4">
                <Skeleton className="aspect-[4/5] w-24 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-hairline border-y border-hairline">
            {quote.lines.map((line) => (
              <CartLineRow
                key={line.variantId}
                line={line}
                onQty={(q) => setQuantity(line.variantId, Math.min(q, line.stock))}
                onRemove={() => remove(line.variantId)}
              />
            ))}
          </ul>
        )}
      </section>

      <aside className="rounded-3xl bg-cream p-6 lg:sticky lg:top-36">
        <h2 className="font-serif text-2xl font-semibold">Resumo</h2>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium">Como quer receber?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "ENTREGA", label: "Entrega", icon: Truck },
                { value: "RETIRADA", label: "Retirar na loja", icon: Store },
              ] as const
            ).map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={shipping === o.value}
                onClick={() => {
                  setShipping(o.value);
                  savePref(SHIPPING_KEY, o.value);
                }}
                className={cn(
                  "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-medium",
                  shipping === o.value ? "border-olive bg-paper text-olive" : "border-transparent bg-paper/60 text-stone-ink",
                )}
              >
                <o.icon className="size-4" /> {o.label}
              </button>
            ))}
          </div>
        </fieldset>

        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const code = couponInput.trim().toUpperCase() || null;
            setCoupon(code);
            savePref(COUPON_KEY, code);
          }}
        >
          <div className="relative flex-1">
            <TicketPercent className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-ink" />
            <Input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Cupom de desconto"
              aria-label="Cupom de desconto"
              className="pl-9 uppercase placeholder:normal-case"
            />
          </div>
          <Button type="submit" variant="outline">
            Aplicar
          </Button>
        </form>
        {quote?.couponError && coupon ? (
          <p className="mt-2 text-xs font-medium text-rose-deep">{quote.couponError}</p>
        ) : quote?.coupon ? (
          <p className="mt-2 text-xs font-medium text-olive">
            Cupom {quote.coupon.code} aplicado: {quote.coupon.description}.
          </p>
        ) : null}

        <div className="mt-6">
          <Summary quote={quote} loading={loading} />
        </div>

        <Button asChild size="lg" className={cn("mt-6 w-full", blocked && "pointer-events-none opacity-50")}>
          <Link href="/checkout" aria-disabled={blocked}>
            Finalizar compra <ArrowRight />
          </Link>
        </Button>
        <Link href="/produtos" className="mt-3 block text-center text-sm font-medium text-olive hover:underline">
          Continuar comprando
        </Link>
      </aside>
    </div>
  );
}
