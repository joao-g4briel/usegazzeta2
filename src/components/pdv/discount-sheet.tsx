"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Percent, TicketPercent } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { cn } from "@/lib/utils";
import { formatBRL, parseMoney } from "@/lib/money";
import { validatePosCouponAction } from "@/actions/sale-actions";

export type ManualDiscount = { type: "amount" | "percent"; value: number; reason: string };
export type AppliedCoupon = { code: string; description: string; discount: number };

export function DiscountSheet({
  open,
  onOpenChange,
  subtotalCents,
  items,
  discount,
  coupon,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subtotalCents: number;
  items: { variantId: string; quantity: number }[];
  discount: ManualDiscount | null;
  coupon: AppliedCoupon | null;
  onApply: (discount: ManualDiscount | null, coupon: AppliedCoupon | null) => void;
}) {
  const [mode, setMode] = useState<"amount" | "percent" | "coupon">(coupon ? "coupon" : discount?.type ?? "amount");
  const [value, setValue] = useState(discount ? String(discount.value).replace(".", ",") : "");
  const [reason, setReason] = useState(discount?.reason ?? "");
  const [code, setCode] = useState(coupon?.code ?? "");
  const [pending, start] = useTransition();

  const numeric = parseMoney(value || "0") || 0;
  const previewCents =
    mode === "percent" ? Math.round((subtotalCents * Math.min(numeric, 100)) / 100) : Math.round(numeric * 100);

  function apply() {
    if (mode === "coupon") {
      if (!code.trim()) {
        onApply(discount, null);
        onOpenChange(false);
        return;
      }
      start(async () => {
        const result = await validatePosCouponAction(code, items);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        onApply(discount, result.data);
        toast.success(`Cupom ${result.data.code} aplicado`);
        onOpenChange(false);
      });
      return;
    }
    if (numeric <= 0) {
      onApply(null, coupon);
      onOpenChange(false);
      return;
    }
    if (mode === "percent" && numeric > 100) return toast.error("O desconto máximo é 100%.");
    if (previewCents > subtotalCents) return toast.error("O desconto não pode passar do subtotal.");
    onApply({ type: mode, value: numeric, reason: reason.trim() }, coupon);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl border-none bg-paper px-5 pt-6 pb-8">
        <SheetTitle className="font-serif text-2xl">Desconto</SheetTitle>
        <SheetDescription>Subtotal de {formatBRL(subtotalCents / 100)}. O servidor confere o valor final.</SheetDescription>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-linen p-1">
          {(
            [
              ["amount", "Em R$", null],
              ["percent", "Em %", Percent],
              ["coupon", "Cupom", TicketPercent],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn("h-10 rounded-xl text-sm font-semibold", mode === m ? "bg-paper shadow-soft" : "text-stone-ink")}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === "coupon" ? (
          <Field label="Código do cupom" htmlFor="coupon-code">
            <Input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="h-12 text-lg uppercase" placeholder="EX.: BEMVINDA10" />
          </Field>
        ) : (
          <div className="space-y-4">
            <Field label={mode === "percent" ? "Percentual" : "Valor do desconto"} htmlFor="disc-value" hint={previewCents > 0 ? `Desconto de ${formatBRL(previewCents / 100)}` : undefined}>
              <div className="flex h-12 items-center rounded-xl border border-input bg-paper px-3">
                <span className="text-stone-ink">{mode === "percent" ? "%" : "R$"}</span>
                <input
                  id="disc-value"
                  inputMode="decimal"
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value.replace(/[^\d,.]/g, ""))}
                  className="h-full min-w-0 flex-1 bg-transparent px-2 text-lg font-semibold tabular outline-none"
                />
              </div>
            </Field>
            <Field label="Motivo" htmlFor="disc-reason" optional>
              <Input id="disc-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cliente fiel, peça com avaria" />
            </Field>
          </div>
        )}
        <div className="flex gap-2">
          {discount || coupon ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                onApply(mode === "coupon" ? discount : null, mode === "coupon" ? null : coupon);
                onOpenChange(false);
              }}
            >
              Remover
            </Button>
          ) : null}
          <Button type="button" size="lg" className="flex-1" onClick={apply} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Aplicar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
