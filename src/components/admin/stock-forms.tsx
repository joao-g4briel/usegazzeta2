"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { History, Loader2, Minus, PackagePlus, Plus, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ADJUSTMENT_REASONS } from "@/lib/constants";
import { Field } from "@/components/shared/field";
import { VariantPicker } from "@/components/admin/variant-picker";
import { stockAdjustmentAction, stockEntryAction } from "@/actions/inventory-actions";
import type { PosVariant } from "@/types/catalog";

export function StockEntryForm({ initialVariantId }: { initialVariantId?: string | null }) {
  const [variant, setVariant] = useState<PosVariant | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [cost, setCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  function submit() {
    if (!variant) return;
    setErrors({});
    start(async () => {
      const r = await stockEntryAction({
        variantId: variant.variantId,
        quantity,
        unitCost: cost || null,
        supplier,
        note,
      });
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        return void toast.error(r.error);
      }
      toast.success("Estoque atualizado", {
        description: `${variant.productName} · ${variant.label}: ${r.data.stockBefore} → ${r.data.stockAfter}`,
      });
      setVariant({ ...variant, stock: r.data.stockAfter });
      setQuantity("1");
      setNote("");
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <section className="space-y-5 rounded-2xl border border-hairline bg-paper p-5 sm:p-6">
        <Field label="Produto e variante">
          <VariantPicker value={variant} onChange={setVariant} initialVariantId={initialVariantId} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantidade recebida" htmlFor="qty" error={errors.quantity}>
            <div className="flex h-12 items-center rounded-xl border border-input bg-paper">
              <button type="button" aria-label="Menos" onClick={() => setQuantity(String(Math.max(1, Number(quantity) - 1)))} className="inline-flex size-12 items-center justify-center">
                <Minus className="size-4" />
              </button>
              <input id="qty" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} className="h-full min-w-0 flex-1 bg-transparent text-center text-lg font-semibold tabular outline-none" />
              <button type="button" aria-label="Mais" onClick={() => setQuantity(String(Number(quantity || 0) + 1))} className="inline-flex size-12 items-center justify-center">
                <Plus className="size-4" />
              </button>
            </div>
          </Field>
          <Field label="Custo unitário (R$)" htmlFor="cost" optional hint="Atualiza o custo da variante." error={errors.unitCost}>
            <Input id="cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0,00" className="h-12" />
          </Field>
          <Field label="Fornecedor" htmlFor="supplier" optional>
            <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="h-12" />
          </Field>
          <Field label="Observação" htmlFor="note" optional>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: nota fiscal 1234" className="h-12" />
          </Field>
        </div>
        <Button size="lg" className="w-full sm:w-auto" disabled={!variant || pending || !Number(quantity)} onClick={submit}>
          {pending ? <Loader2 className="animate-spin" /> : <PackagePlus />}
          Registrar entrada
        </Button>
      </section>
      <aside className="h-fit space-y-3 rounded-2xl bg-cream p-5 text-sm text-stone-ink">
        <p className="font-serif text-xl font-semibold text-ink">Como funciona</p>
        <p>A entrada soma a quantidade ao estoque da variante escolhida e grava uma movimentação ENTRADA com estoque anterior, posterior, custo e fornecedor.</p>
        <p>Recebeu uma peça que ainda não existe? Use o <Link href="/pdv/scanner?modo=consulta" className="font-semibold text-olive underline-offset-4 hover:underline">Scanner</Link> para o cadastro rápido pelo código de barras.</p>
        {variant ? (
          <Link href={`/admin/estoque/movimentacoes?variante=${variant.variantId}`} className="inline-flex items-center gap-1.5 font-semibold text-olive">
            <History className="size-4" /> Histórico desta variante
          </Link>
        ) : null}
      </aside>
    </div>
  );
}

export function StockAdjustForm({ initialVariantId }: { initialVariantId?: string | null }) {
  const [variant, setVariant] = useState<PosVariant | null>(null);
  const [mode, setMode] = useState<"add" | "remove" | "set">("remove");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState<(typeof ADJUSTMENT_REASONS)[number]["value"] | "">("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const qty = Number(quantity || 0);
  const after = variant ? (mode === "add" ? variant.stock + qty : mode === "remove" ? variant.stock - qty : qty) : null;
  const invalid = after !== null && after < 0;

  function submit() {
    if (!variant || !reason) return;
    start(async () => {
      const r = await stockAdjustmentAction({ variantId: variant.variantId, mode, quantity, reason, note });
      if (!r.ok) return void toast.error(r.error);
      if (!r.data.changed) {
        toast("Estoque já confere com a contagem — nada foi alterado.");
        return;
      }
      toast.success("Estoque atualizado", { description: `${variant.productName} · ${variant.label}: agora ${r.data.stockAfter}` });
      setVariant({ ...variant, stock: r.data.stockAfter });
      setNote("");
    });
  }

  return (
    <section className="max-w-3xl space-y-5 rounded-2xl border border-hairline bg-paper p-5 sm:p-6">
      <Field label="Produto e variante">
        <VariantPicker value={variant} onChange={setVariant} initialVariantId={initialVariantId} />
      </Field>
      <div>
        <p className="mb-2 text-[0.8125rem] font-medium">Tipo de ajuste</p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["remove", "Retirar", Minus],
              ["add", "Adicionar", Plus],
              ["set", "Contagem", Scale],
            ] as const
          ).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border text-sm font-semibold",
                mode === m ? "border-olive bg-sage-mist text-olive" : "border-hairline",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={mode === "set" ? "Quantidade contada" : "Quantidade"} htmlFor="adj-qty" error={invalid ? "O estoque não pode ficar negativo." : undefined}>
          <Input id="adj-qty" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} className="h-12 text-lg font-semibold tabular" aria-invalid={invalid} />
        </Field>
        <Field label="Motivo" htmlFor="adj-reason" hint="Sempre registrado na movimentação.">
          <select id="adj-reason" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="h-12 w-full rounded-xl border border-input bg-paper px-3 text-sm">
            <option value="" disabled>
              Escolha o motivo
            </option>
            {ADJUSTMENT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Detalhes" htmlFor="adj-note" optional>
        <Textarea id="adj-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: peça manchada no provador" className="rounded-xl bg-paper" />
      </Field>
      {variant && after !== null ? (
        <p className="rounded-xl bg-offwhite px-4 py-3 text-sm">
          Estoque de <strong>{variant.productName} · {variant.label}</strong>: <span className="tabular">{variant.stock}</span> →{" "}
          <strong className={cn("tabular", invalid && "text-destructive")}>{after}</strong>
        </p>
      ) : null}
      <Button size="lg" disabled={!variant || !reason || pending || invalid || (mode !== "set" && !qty)} onClick={submit}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Registrar ajuste
      </Button>
    </section>
  );
}
