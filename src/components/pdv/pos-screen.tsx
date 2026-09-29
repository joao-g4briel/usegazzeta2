"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronRight, LayoutGrid, Loader2, ScanBarcode, ShieldCheck, ShoppingBag, TicketPercent, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatBRL, parseMoney } from "@/lib/money";
import { can } from "@/lib/permissions";
import { finalizeSaleAction, validatePosCouponAction } from "@/actions/sale-actions";
import { getVariantAction } from "@/actions/inventory-actions";
import { usePos } from "@/components/pdv/pos-provider";
import { PosCartItem } from "@/components/pdv/pos-cart-item";
import { PaymentSelector, type PaymentState } from "@/components/pdv/payment-selector";
import { DiscountSheet, type AppliedCoupon, type ManualDiscount } from "@/components/pdv/discount-sheet";
import { CustomerPicker, type PosCustomer } from "@/components/pdv/customer-picker";
import { CatalogSheet, ProductSearch } from "@/components/pdv/product-search";
import { ScannerWorkspace } from "@/components/pdv/scanner-workspace";
import { SaleSuccess } from "@/components/pdv/sale-success";
import type { SaleReceipt } from "@/services/sale-service";
import type { PosVariant } from "@/types/catalog";

export function PosScreen() {
  const pos = usePos();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discount, setDiscount] = useState<ManualDiscount | null>(null);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [customer, setCustomer] = useState<PosCustomer | null>(null);
  const [payment, setPayment] = useState<PaymentState>({ method: "PIX", received: "", installments: 1 });
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const items = useMemo(
    () => pos.lines.map((l) => ({ variantId: l.variant.variantId, quantity: l.quantity })),
    [pos.lines],
  );
  const itemsKey = JSON.stringify(items);

  // Cupom percentual muda com o carrinho: o servidor recalcula.
  useEffect(() => {
    if (!coupon || !items.length) return;
    const t = setTimeout(async () => {
      const r = await validatePosCouponAction(coupon.code, items);
      if (r.ok) setCoupon(r.data);
      else {
        setCoupon(null);
        toast.error(r.error);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revalida só quando os itens mudam
  }, [itemsKey]);

  const subtotalCents = pos.subtotalCents;
  const manualCents = discount
    ? discount.type === "percent"
      ? Math.round((subtotalCents * discount.value) / 100)
      : Math.round(discount.value * 100)
    : 0;
  const couponCents = coupon ? Math.round(coupon.discount * 100) : 0;
  const discountCents = Math.min(subtotalCents, manualCents + couponCents);
  const totalCents = subtotalCents - discountCents;
  const receivedCents = Math.round((parseMoney(payment.received || "0") || 0) * 100);
  const cashShort = payment.method === "DINHEIRO" && payment.received !== "" && receivedCents < totalCents;

  function pick(variant: PosVariant) {
    const outcome = pos.add(variant);
    if (outcome !== "no-stock") {
      setLastAdded(variant.variantId);
      toast.success("Produto adicionado", { description: `${variant.productName} · ${variant.label}`, duration: 1600 });
    }
  }

  function resetSale() {
    pos.clear();
    setDiscount(null);
    setCoupon(null);
    setCustomer(null);
    setPayment({ method: "PIX", received: "", installments: 1 });
  }

  function finalize() {
    if (!pos.lines.length) return;
    if (cashShort) {
      toast.error("O valor recebido é menor que o total.");
      return;
    }
    start(async () => {
      const result = await finalizeSaleAction({
        items,
        discount: discount ? { type: discount.type, value: discount.value } : null,
        discountReason: discount?.reason || null,
        couponCode: coupon?.code ?? null,
        customerId: customer?.id ?? null,
        payments: [
          {
            method: payment.method,
            amount: null,
            receivedAmount: payment.method === "DINHEIRO" && payment.received ? payment.received : null,
            installments: payment.method === "CREDITO" ? payment.installments : null,
          },
        ],
      });
      if (!result.ok) {
        toast.error(result.error);
        if (result.code === "INSUFFICIENT_STOCK" || result.code === "INACTIVE") {
          // Atualiza o estoque das linhas com o valor real do banco.
          const fresh = await Promise.all(items.map((i) => getVariantAction(i.variantId)));
          pos.updateVariants(fresh.flatMap((r) => (r.ok && r.data ? [r.data] : [])));
        }
        return;
      }
      navigator.vibrate?.(120);
      setReceipt(result.data);
    });
  }

  if (receipt) {
    return (
      <SaleSuccess
        receipt={receipt}
        customer={customer}
        canSeeSale={can(pos.role, "orders")}
        onNewSale={() => {
          setReceipt(null);
          resetSale();
        }}
      />
    );
  }

  const empty = pos.ready && !pos.lines.length;

  return (
    <div className="mx-auto grid w-full max-w-[1400px] flex-1 gap-6 px-3 pt-4 pb-36 sm:px-5 lg:grid-cols-[1fr_1.1fr] lg:gap-8 lg:pb-10">
      {/* Coluna de entrada: escanear, buscar, catálogo */}
      <section className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="group flex h-[4.5rem] items-center justify-center gap-3 rounded-3xl bg-olive text-lg font-bold tracking-[0.06em] text-offwhite uppercase shadow-[0_18px_34px_-20px_rgb(74_91_71/0.9)] transition-colors hover:bg-olive-deep active:translate-y-px lg:h-24 lg:text-xl"
        >
          <ScanBarcode className="size-8 transition-transform group-hover:scale-105" strokeWidth={1.6} />
          Escanear produto
        </button>
        <ProductSearch onPick={pick} />
        <Button variant="outline" size="lg" onClick={() => setCatalogOpen(true)} className="justify-between">
          <span className="inline-flex items-center gap-2">
            <LayoutGrid /> Adicionar pelo catálogo
          </span>
          <ChevronRight />
        </Button>
        <p className="hidden items-center gap-2 px-1 pt-2 text-sm text-stone-ink lg:flex">
          <ShieldCheck className="size-4 text-olive" /> Preço e estoque confirmados no servidor ao finalizar.
        </p>
      </section>

      {/* Carrinho e pagamento */}
      <section className="flex min-w-0 flex-col gap-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-[2.1rem] leading-none font-medium sm:text-[2.6rem]">Carrinho de venda</h1>
            <p className="mt-1.5 text-sm text-stone-ink">Adicione os produtos e finalize a venda.</p>
          </div>
          {pos.lines.length ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  <Trash2 /> <span className="max-sm:sr-only">Limpar carrinho</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Limpar o carrinho?</AlertDialogTitle>
                <AlertDialogDescription>Os {pos.itemCount} itens, o desconto e a cliente serão removidos desta venda.</AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter</AlertDialogCancel>
                  <AlertDialogAction onClick={resetSale}>Limpar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>

        {empty ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[#d6ccbb] bg-paper/60 px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-sage-light text-olive">
              <ShoppingBag className="size-6" />
            </span>
            <p className="font-serif text-2xl font-semibold">Carrinho vazio</p>
            <p className="max-w-xs text-sm text-stone-ink">
              Escaneie o código de barras da peça, busque pelo nome ou escolha no catálogo.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Itens da venda">
            {pos.lines.map((line) => (
              <PosCartItem key={line.variant.variantId} line={line} fresh={line.variant.variantId === lastAdded} />
            ))}
          </ul>
        )}

        {!empty ? (
          <>
            <CustomerPicker value={customer} onChange={setCustomer} />

            <div className="rounded-3xl border border-hairline bg-paper p-4 shadow-soft sm:p-5">
              <dl className="space-y-3 px-1">
                <div className="flex items-baseline justify-between">
                  <dt className="text-base">
                    Subtotal <span className="text-sm text-stone-ink">({pos.itemCount} {pos.itemCount === 1 ? "item" : "itens"})</span>
                  </dt>
                  <dd className="text-lg font-semibold tabular">{formatBRL(subtotalCents / 100)}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex min-w-0 items-center gap-1.5">
                    Desconto
                    <button
                      type="button"
                      onClick={() => setDiscountOpen(true)}
                      className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium whitespace-nowrap text-olive hover:bg-sage-mist"
                    >
                      <TicketPercent className="size-4 shrink-0" />
                      <span className="truncate">
                        {coupon ? coupon.code : discount ? (discount.type === "percent" ? `${discount.value}%` : "Manual") : "Cupom/desconto"}
                      </span>
                    </button>
                  </dt>
                  <dd>
                    <button type="button" onClick={() => setDiscountOpen(true)} className="inline-flex items-center gap-1 text-base font-semibold whitespace-nowrap tabular sm:text-lg">
                      {discountCents ? `− ${formatBRL(discountCents / 100)}` : formatBRL(0)}
                      <ChevronRight className="size-4 text-stone-ink" />
                    </button>
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-sage-light/80 px-5 py-4">
                <span className="font-serif text-2xl font-semibold sm:text-3xl">Total da venda</span>
                <span className="font-serif text-[2.1rem] leading-none font-semibold tabular sm:text-[2.6rem]">{formatBRL(totalCents / 100)}</span>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold">Forma de pagamento</h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-stone-ink">
                  <ShieldCheck className="size-4 text-olive" /> Validado no servidor
                </span>
              </div>
              <PaymentSelector value={payment} onChange={setPayment} totalCents={totalCents} />
            </div>
          </>
        ) : null}
      </section>

      {!empty ? (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper/95 backdrop-blur-md lg:static lg:col-start-2 lg:border-none lg:bg-transparent lg:backdrop-blur-none">
          <div className="mx-auto max-w-[1400px] px-3 py-3 sm:px-5 lg:p-0">
            <Button
              size="xl"
              className={cn("h-16 w-full rounded-2xl text-lg", pending && "opacity-80")}
              disabled={pending || !pos.lines.length || cashShort}
              onClick={finalize}
            >
              {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag className="size-6" strokeWidth={1.6} />}
              <span className="mx-1 h-7 w-px bg-offwhite/40" aria-hidden />
              {pending ? "Finalizando…" : `Finalizar venda · ${formatBRL(totalCents / 100)}`}
            </Button>
          </div>
        </div>
      ) : null}

      {scannerOpen ? <ScannerWorkspace initialMode="venda" layout="overlay" onClose={() => setScannerOpen(false)} /> : null}
      <CatalogSheet open={catalogOpen} onOpenChange={setCatalogOpen} onPick={pick} />
      <DiscountSheet
        key={String(discountOpen)}
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        subtotalCents={subtotalCents}
        items={items}
        discount={discount}
        coupon={coupon}
        onApply={(d, c) => {
          setDiscount(d);
          setCoupon(c);
        }}
      />
    </div>
  );
}
