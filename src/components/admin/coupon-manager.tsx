"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, TicketPercent } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/shared/field";
import { EmptyState } from "@/components/shared/misc";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { saveCouponAction, toggleCouponAction } from "@/actions/admin-actions";
import type { CouponRow } from "@/services/coupon-service";

type Form = {
  code: string;
  description: string;
  type: "PERCENTUAL" | "VALOR_FIXO";
  value: string;
  minimumAmount: string;
  startsAt: string;
  endsAt: string;
  maxUses: string;
  active: boolean;
};

const empty: Form = { code: "", description: "", type: "PERCENTUAL", value: "", minimumAmount: "", startsAt: "", endsAt: "", maxUses: "", active: true };

function toForm(c: CouponRow): Form {
  return {
    code: c.code,
    description: c.description ?? "",
    type: c.type,
    value: String(c.value).replace(".", ","),
    minimumAmount: c.minimumAmount ? String(c.minimumAmount).replace(".", ",") : "",
    startsAt: c.startsAt ? c.startsAt.slice(0, 10) : "",
    endsAt: c.endsAt ? c.endsAt.slice(0, 10) : "",
    maxUses: c.maxUses ? String(c.maxUses) : "",
    active: c.active,
  };
}

function status(c: CouponRow) {
  const now = new Date().toISOString();
  if (!c.active) return { label: "Pausado", tone: "bg-linen text-stone-ink" };
  if (c.endsAt && c.endsAt < now) return { label: "Expirado", tone: "bg-rose-mist text-rose-deep" };
  if (c.startsAt && c.startsAt > now) return { label: "Agendado", tone: "bg-gold-mist text-gold-ink" };
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { label: "Esgotado", tone: "bg-rose-mist text-rose-deep" };
  return { label: "Ativo", tone: "bg-[#e3efe5] text-[#2f6a3f]" };
}

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const [editing, setEditing] = useState<CouponRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function openFor(c: CouponRow | null) {
    setEditing(c);
    setForm(c ? toForm(c) : empty);
    setErrors({});
    setOpen(true);
  }

  function submit() {
    start(async () => {
      const r = await saveCouponAction(
        {
          ...form,
          startsAt: form.startsAt ? `${form.startsAt}T00:00:00-03:00` : null,
          endsAt: form.endsAt ? `${form.endsAt}T23:59:59-03:00` : null,
          minimumAmount: form.minimumAmount || null,
          maxUses: form.maxUses || null,
        },
        editing?.id,
      );
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        return void toast.error(r.error);
      }
      toast.success(r.message);
      setOpen(false);
    });
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => openFor(null)}>
          <Plus /> Novo cupom
        </Button>
      </div>
      {coupons.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => {
            const s = status(c);
            return (
              <article key={c.id} className="flex flex-col gap-3 rounded-2xl border border-hairline bg-paper p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-bold tracking-wide">{c.code}</p>
                    <p className="text-sm text-stone-ink">{c.description ?? "—"}</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", s.tone)}>{s.label}</span>
                </div>
                <p className="text-2xl font-semibold">
                  {c.type === "PERCENTUAL" ? `${c.value}%` : formatBRL(c.value)} <span className="text-sm font-normal text-stone-ink">de desconto</span>
                </p>
                <ul className="space-y-1 text-xs text-stone-ink">
                  <li>{c.minimumAmount ? `Compras a partir de ${formatBRL(c.minimumAmount)}` : "Sem valor mínimo"}</li>
                  <li>
                    {c.startsAt || c.endsAt
                      ? `Válido ${c.startsAt ? `de ${formatDate(c.startsAt)}` : ""} ${c.endsAt ? `até ${formatDate(c.endsAt)}` : ""}`
                      : "Sem data de validade"}
                  </li>
                  <li className="tabular">
                    Usado {c.usedCount} {c.maxUses ? `de ${c.maxUses}` : ""} {c.usedCount === 1 ? "vez" : "vezes"}
                  </li>
                </ul>
                <div className="mt-auto flex items-center justify-between border-t border-hairline pt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={c.active}
                      onCheckedChange={(v) =>
                        start(async () => {
                          const r = await toggleCouponAction(c.id, v);
                          if (r.ok) toast.success(r.message);
                          else toast.error(r.error);
                        })
                      }
                    />
                    Ativo
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => openFor(c)}>
                    <Pencil /> Editar
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<TicketPercent />} title="Nenhum cupom" description="Crie cupons para a loja online e o PDV." />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-3xl bg-paper">
          <DialogTitle className="font-serif text-2xl">{editing ? `Editar ${editing.code}` : "Novo cupom"}</DialogTitle>
          <DialogDescription>Vale na loja online e no PDV. O desconto é validado no servidor.</DialogDescription>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Código" htmlFor="cp-code" error={errors.code}>
              <Input id="cp-code" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))} className="font-mono uppercase" />
            </Field>
            <Field label="Tipo" htmlFor="cp-type">
              <select id="cp-type" value={form.type} onChange={(e) => set("type", e.target.value as Form["type"])} className="h-10 w-full rounded-xl border border-input bg-paper px-3 text-sm">
                <option value="PERCENTUAL">Percentual (%)</option>
                <option value="VALOR_FIXO">Valor fixo (R$)</option>
              </select>
            </Field>
            <Field label={form.type === "PERCENTUAL" ? "Percentual" : "Valor (R$)"} htmlFor="cp-value" error={errors.value}>
              <Input id="cp-value" inputMode="decimal" value={form.value} onChange={(e) => set("value", e.target.value)} />
            </Field>
            <Field label="Valor mínimo (R$)" htmlFor="cp-min" optional error={errors.minimumAmount}>
              <Input id="cp-min" inputMode="decimal" value={form.minimumAmount} onChange={(e) => set("minimumAmount", e.target.value)} />
            </Field>
            <Field label="Data inicial" htmlFor="cp-start" optional>
              <Input id="cp-start" type="date" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            </Field>
            <Field label="Data final" htmlFor="cp-end" optional error={errors.endsAt}>
              <Input id="cp-end" type="date" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </Field>
            <Field label="Quantidade máxima de usos" htmlFor="cp-max" optional>
              <Input id="cp-max" inputMode="numeric" value={form.maxUses} onChange={(e) => set("maxUses", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Descrição" htmlFor="cp-desc" optional>
              <Input id="cp-desc" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} /> Cupom ativo
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Salvar cupom
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
