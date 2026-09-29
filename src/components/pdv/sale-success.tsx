"use client";

import Link from "next/link";
import { Check, MessageCircle, Plus, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { SaleReceipt } from "@/services/sale-service";
import type { PosCustomer } from "@/components/pdv/customer-picker";

export function SaleSuccess({
  receipt,
  customer,
  onNewSale,
  canSeeSale,
}: {
  receipt: SaleReceipt;
  customer: PosCustomer | null;
  onNewSale: () => void;
  canSeeSale: boolean;
}) {
  const wa = customer?.whatsapp?.replace(/\D/g, "");
  const text = encodeURIComponent(
    `Olá, ${customer?.name.split(" ")[0] ?? ""}! Obrigada pela compra na Use Gazzeta!\nVenda #${receipt.number} · ${receipt.itemCount} ${receipt.itemCount === 1 ? "item" : "itens"} · Total ${formatBRL(receipt.total)}`,
  );
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-olive px-6 py-10 text-center text-offwhite">
      <span className="flex size-20 animate-pop-in items-center justify-center rounded-full bg-offwhite text-olive">
        <Check className="size-10" strokeWidth={2.4} />
      </span>
      <h1 className="mt-6 font-serif text-[2.4rem] leading-tight font-medium">Venda realizada com sucesso</h1>
      <p className="mt-2 text-offwhite/90">
        Venda #{receipt.number} · {receipt.itemCount} {receipt.itemCount === 1 ? "item" : "itens"} · estoque atualizado
      </p>

      <dl className="mt-8 w-full max-w-sm space-y-2.5 rounded-3xl bg-offwhite p-6 text-left text-ink">
        {receipt.discount > 0 ? (
          <>
            <div className="flex justify-between text-sm"><dt className="text-stone-ink">Subtotal</dt><dd className="tabular">{formatBRL(receipt.subtotal)}</dd></div>
            <div className="flex justify-between text-sm"><dt className="text-stone-ink">Desconto</dt><dd className="tabular">− {formatBRL(receipt.discount)}</dd></div>
          </>
        ) : null}
        <div className="flex items-baseline justify-between"><dt className="font-serif text-xl font-semibold">Total</dt><dd className="text-2xl font-bold tabular">{formatBRL(receipt.total)}</dd></div>
        {receipt.payments.map((p, i) => (
          <div key={i} className="flex justify-between text-sm"><dt className="text-stone-ink">{PAYMENT_METHOD_LABELS[p.method]}</dt><dd className="tabular">{formatBRL(p.amount)}</dd></div>
        ))}
        {receipt.change > 0 ? (
          <div className="mt-2 flex items-baseline justify-between rounded-2xl bg-sage-light px-4 py-3">
            <dt className="font-semibold">Troco</dt>
            <dd className="text-2xl font-bold text-olive tabular">{formatBRL(receipt.change)}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <Button size="xl" variant="gold" onClick={onNewSale} autoFocus>
          <Plus /> Nova venda
        </Button>
        {wa ? (
          <Button size="lg" variant="outline" asChild className="border-white/40 bg-transparent text-offwhite hover:bg-white/10">
            <a href={`https://wa.me/${wa.startsWith("55") ? wa : `55${wa}`}?text=${text}`} target="_blank" rel="noreferrer">
              <MessageCircle /> Enviar resumo no WhatsApp
            </a>
          </Button>
        ) : null}
        {canSeeSale ? (
          <Button size="lg" variant="ghost" asChild className="text-offwhite hover:bg-white/10 hover:text-offwhite">
            <Link href={`/admin/vendas/${receipt.id}`}>
              <ReceiptText /> Ver detalhes da venda
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
