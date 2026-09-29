"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, UserRound, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, maskPhone } from "@/components/shared/field";
import { quickCreateCustomerAction, searchCustomersAction } from "@/actions/sale-actions";

export type PosCustomer = { id: string; name: string; whatsapp: string | null; phone: string | null; email: string | null };

export function CustomerPicker({
  value,
  onChange,
}: {
  value: PosCustomer | null;
  onChange: (c: PosCustomer | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PosCustomer[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(async () => {
      const r = await searchCustomersAction(q);
      if (r.ok) setResults(r.data);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-paper px-4 py-3">
        <UserRound className="size-5 shrink-0 text-olive" strokeWidth={1.7} />
        {value ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{value.name}</p>
              <p className="text-xs text-stone-ink">{value.whatsapp ? maskPhone(value.whatsapp) : value.email ?? "Cliente"}</p>
            </div>
            <button type="button" onClick={() => onChange(null)} aria-label="Remover cliente" className="inline-flex size-9 items-center justify-center rounded-full hover:bg-linen">
              <X className="size-4" />
            </button>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-stone-ink">Cliente (opcional)</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-olive">
              Adicionar
            </Button>
          </>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-lg overflow-y-auto rounded-t-3xl border-none bg-paper px-5 pt-6 pb-8">
          <SheetTitle className="font-serif text-2xl">Cliente da venda</SheetTitle>
          <SheetDescription>A venda fica no histórico da cliente.</SheetDescription>
          {!creating ? (
            <>
              <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, WhatsApp ou e-mail" className="h-12" />
              <ul className="divide-y divide-hairline">
                {(q.trim().length >= 2 ? results : []).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-sm text-stone-ink">{c.whatsapp ? maskPhone(c.whatsapp) : c.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="soft" size="lg" onClick={() => { setCreating(true); setName(q); }}>
                <UserPlus /> Cadastrar nova cliente
              </Button>
            </>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                start(async () => {
                  const r = await quickCreateCustomerAction({ name, whatsapp, email: null, phone: null, cpf: null, notes: null });
                  if (!r.ok) return void toast.error(r.error);
                  onChange(r.data);
                  toast.success("Cliente cadastrada");
                  setCreating(false);
                  setOpen(false);
                });
              }}
            >
              <Field label="Nome" htmlFor="c-name">
                <Input id="c-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
              </Field>
              <Field label="WhatsApp" htmlFor="c-wa">
                <Input id="c-wa" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} placeholder="(81) 99999-9999" className="h-12" />
              </Field>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="lg" onClick={() => setCreating(false)}>
                  Voltar
                </Button>
                <Button type="submit" size="lg" className="flex-1" disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" /> : null} Salvar cliente
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
