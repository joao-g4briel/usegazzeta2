"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/shared/field";
import { ProductArt, KIND_FIELDS } from "@/components/shared/product-art";
import { cn } from "@/lib/utils";
import { VARIANT_KIND_LABELS, type VariantKind } from "@/lib/constants";
import { saveCategoryAction } from "@/actions/product-actions";
import type { CategoryDTO } from "@/types/catalog";

type Form = { name: string; tagline: string; description: string; variantKind: VariantKind; position: string; active: boolean };

export function CategoryManager({ categories }: { categories: CategoryDTO[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [form, setForm] = useState<Form>({ name: "", tagline: "", description: "", variantKind: "APPAREL", position: "0", active: true });
  const [pending, start] = useTransition();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function openFor(c: CategoryDTO | null) {
    setEditing(c);
    setForm(
      c
        ? { name: c.name, tagline: c.tagline ?? "", description: c.description ?? "", variantKind: c.variantKind, position: String(c.position), active: c.active }
        : { name: "", tagline: "", description: "", variantKind: "APPAREL", position: String(categories.length + 1), active: true },
    );
    setOpen(true);
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => openFor(null)}>
          <Plus /> Nova categoria
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => (
          <article key={c.id} className={cn("flex items-center gap-4 rounded-2xl border border-hairline bg-paper p-4 shadow-soft", !c.active && "opacity-60")}>
            <div className={cn("flex size-16 shrink-0 items-center justify-center rounded-xl", KIND_FIELDS[c.variantKind])}>
              <ProductArt kind={c.variantKind} className="h-12 w-auto" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-stone-ink">
                {VARIANT_KIND_LABELS[c.variantKind]} · {c.productCount ?? 0} produtos
              </p>
              {c.tagline ? <p className="truncate text-xs text-stone-ink">“{c.tagline}”</p> : null}
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={`Editar ${c.name}`} onClick={() => openFor(c)}>
              <Pencil />
            </Button>
          </article>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-3xl bg-paper">
          <DialogTitle className="font-serif text-2xl">{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>O tipo de variação define os campos do cadastro e do scanner.</DialogDescription>
          <div className="grid gap-4">
            <Field label="Nome" htmlFor="cat-name">
              <Input id="cat-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Tipo de variação" htmlFor="cat-kind">
              <select id="cat-kind" value={form.variantKind} onChange={(e) => set("variantKind", e.target.value as VariantKind)} className="h-10 w-full rounded-xl border border-input bg-paper px-3 text-sm">
                {(Object.keys(VARIANT_KIND_LABELS) as VariantKind[]).map((k) => (
                  <option key={k} value={k}>
                    {VARIANT_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Frase da vitrine" htmlFor="cat-tag" optional>
              <Input id="cat-tag" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Ex.: Looks para todas as ocasiões" />
            </Field>
            <Field label="Descrição" htmlFor="cat-desc" optional>
              <Input id="cat-desc" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <div className="flex items-center justify-between gap-4">
              <Field label="Ordem" htmlFor="cat-pos" className="w-28">
                <Input id="cat-pos" inputMode="numeric" value={form.position} onChange={(e) => set("position", e.target.value.replace(/\D/g, ""))} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} /> Ativa na loja
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await saveCategoryAction(form, editing?.id);
                  if (!r.ok) return void toast.error(r.error);
                  toast.success(r.message);
                  setOpen(false);
                })
              }
            >
              {pending ? <Loader2 className="animate-spin" /> : null} Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
