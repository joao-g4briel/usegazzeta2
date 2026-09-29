"use client";

import { Banknote, CreditCard, Ellipsis, QrCode, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL, parseMoney } from "@/lib/money";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/constants";

const OPTIONS: { method: PaymentMethod; icon: typeof QrCode; hint: string }[] = [
  { method: "PIX", icon: QrCode, hint: "Aprovação imediata" },
  { method: "DINHEIRO", icon: Banknote, hint: "Registrar valor recebido" },
  { method: "CREDITO", icon: CreditCard, hint: "Até 12x" },
  { method: "DEBITO", icon: WalletCards, hint: "Aprovação imediata" },
  { method: "OUTROS", icon: Ellipsis, hint: "Vale, crediário…" },
];

export type PaymentState = {
  method: PaymentMethod;
  received: string;
  installments: number;
};

export function PaymentSelector({
  value,
  onChange,
  totalCents,
}: {
  value: PaymentState;
  onChange: (v: PaymentState) => void;
  totalCents: number;
}) {
  const receivedCents = Math.round((parseMoney(value.received || "0") || 0) * 100);
  const changeCents = receivedCents - totalCents;
  const total = totalCents / 100;
  const quick = [
    total,
    ...[10, 20, 50, 100, 200].map((n) => Math.ceil(total / n) * n).filter((n) => n > total),
  ].filter((n, i, arr) => arr.indexOf(n) === i).slice(0, 4);

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-2.5">
        {OPTIONS.map(({ method, icon: Icon, hint }) => {
          const selected = value.method === method;
          return (
            <button
              key={method}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ ...value, method })}
              className={cn(
                "relative flex min-h-[6rem] flex-col items-start justify-between gap-2 rounded-2xl border p-3 text-left transition-colors sm:min-h-[6.5rem] sm:p-3.5",
                selected ? "border-2 border-olive bg-sage-mist" : "border-hairline bg-paper hover:border-sage",
              )}
            >
              <Icon className={cn("size-7 sm:size-8", selected ? "text-olive" : "text-stone-ink")} strokeWidth={1.5} />
              <span>
                <span className="block text-[0.95rem] font-semibold text-ink sm:text-base">{PAYMENT_METHOD_LABELS[method]}</span>
                <span className="block text-[0.7rem] leading-tight text-stone-ink sm:text-xs">{hint}</span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "absolute top-2.5 right-2.5 size-5 rounded-full border-2",
                  selected ? "border-olive bg-[radial-gradient(circle,var(--ug-olive)_45%,transparent_50%)]" : "border-[#cfc6b6]",
                )}
              />
            </button>
          );
        })}
      </div>

      {value.method === "DINHEIRO" ? (
        <div className="grid gap-3 rounded-2xl bg-cream p-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="received" className="text-sm font-medium">
              Valor recebido
            </label>
            <div className="mt-1.5 flex h-12 items-center rounded-xl border border-input bg-paper px-3 focus-within:border-sage">
              <span className="text-stone-ink">R$</span>
              <input
                id="received"
                inputMode="decimal"
                value={value.received}
                onChange={(e) => onChange({ ...value, received: e.target.value.replace(/[^\d,.]/g, "") })}
                placeholder={total.toFixed(2).replace(".", ",")}
                className="h-full min-w-0 flex-1 bg-transparent px-2 text-lg font-semibold tabular outline-none"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onChange({ ...value, received: q.toFixed(2).replace(".", ",") })}
                  className="h-8 rounded-lg border border-hairline bg-paper px-2.5 text-xs font-semibold tabular hover:border-olive"
                >
                  {q === total ? "Valor exato" : formatBRL(q)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-xl bg-paper px-5 py-3 sm:min-w-44 sm:text-right" aria-live="polite">
            <span className="text-sm text-stone-ink">Troco</span>
            <span className={cn("text-2xl font-bold tabular", changeCents < 0 ? "text-rose-deep" : "text-olive")}>
              {value.received ? (changeCents < 0 ? `falta ${formatBRL(-changeCents / 100)}` : formatBRL(changeCents / 100)) : "—"}
            </span>
          </div>
        </div>
      ) : null}

      {value.method === "CREDITO" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-cream p-3">
          <span className="px-1 text-sm font-medium">Parcelas</span>
          {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={value.installments === n}
              onClick={() => onChange({ ...value, installments: n })}
              className={cn(
                "h-9 min-w-12 rounded-lg px-2.5 text-sm font-semibold tabular",
                value.installments === n ? "bg-olive text-offwhite" : "bg-paper text-ink hover:bg-linen",
              )}
            >
              {n}x
            </button>
          ))}
          {value.installments > 1 ? (
            <span className="ml-auto text-sm text-stone-ink tabular">
              {value.installments}x de {formatBRL(total / value.installments)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
