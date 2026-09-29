"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, maskCpf, maskPhone } from "@/components/shared/field";
import { saveCustomerAction } from "@/actions/admin-actions";

type CustomerValues = { name: string; email: string; phone: string; whatsapp: string; cpf: string; notes: string };

export function CustomerDialog({
  trigger,
  customer,
}: {
  trigger: ReactNode;
  customer?: { id: string } & Partial<Record<keyof CustomerValues, string | null>>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CustomerValues>({
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ? maskPhone(customer.phone) : "",
    whatsapp: customer?.whatsapp ? maskPhone(customer.whatsapp) : "",
    cpf: customer?.cpf ? maskCpf(customer.cpf) : "",
    notes: customer?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const set = (k: keyof CustomerValues, v: string) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl bg-paper">
        <DialogTitle className="font-serif text-2xl">{customer ? "Editar cliente" : "Nova cliente"}</DialogTitle>
        <DialogDescription>WhatsApp, telefone ou e-mail — pelo menos um contato.</DialogDescription>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setErrors({});
            start(async () => {
              const r = await saveCustomerAction(values, customer?.id);
              if (!r.ok) {
                setErrors(r.fieldErrors ?? {});
                return void toast.error(r.error);
              }
              toast.success(r.message);
              setOpen(false);
              if (!customer) router.push(`/admin/clientes/${r.data.id}`);
              else router.refresh();
            });
          }}
        >
          <Field label="Nome" htmlFor="cu-name" error={errors.name} className="sm:col-span-2">
            <Input id="cu-name" value={values.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="WhatsApp" htmlFor="cu-wa" error={errors.whatsapp}>
            <Input id="cu-wa" inputMode="tel" value={values.whatsapp} onChange={(e) => set("whatsapp", maskPhone(e.target.value))} />
          </Field>
          <Field label="Telefone" htmlFor="cu-phone" optional error={errors.phone}>
            <Input id="cu-phone" inputMode="tel" value={values.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} />
          </Field>
          <Field label="E-mail" htmlFor="cu-email" optional error={errors.email}>
            <Input id="cu-email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="CPF" htmlFor="cu-cpf" optional error={errors.cpf}>
            <Input id="cu-cpf" inputMode="numeric" value={values.cpf} onChange={(e) => set("cpf", maskCpf(e.target.value))} />
          </Field>
          <Field label="Observações" htmlFor="cu-notes" optional className="sm:col-span-2">
            <Textarea id="cu-notes" rows={2} value={values.notes} onChange={(e) => set("notes", e.target.value)} className="rounded-xl bg-paper" />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
