"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormSection, maskPhone } from "@/components/shared/field";
import { uploadImage } from "@/components/shared/image-uploader";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { createUserAction, saveStoreSettingsAction } from "@/actions/admin-actions";
import type { StoreInfo } from "@/services/store-service";

const money = (n: number | null) => (n === null ? "" : n.toFixed(2).replace(".", ","));

export function StoreSettingsForm({ store }: { store: StoreInfo }) {
  const [v, setV] = useState({
    name: store.name,
    phone: store.phone ? maskPhone(store.phone) : "",
    whatsapp: store.whatsapp ? maskPhone(store.whatsapp) : "",
    email: store.email ?? "",
    instagram: store.instagram ?? "",
    address: store.address ?? "",
    heroImageUrl: store.heroImageUrl ?? "",
    shippingFlatRate: money(store.shippingFlatRate),
    freeShippingThreshold: money(store.freeShippingThreshold),
    maxInstallments: String(store.maxInstallments),
    minInstallmentValue: money(store.minInstallmentValue),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof v, value: string) => setV((s) => ({ ...s, [k]: value }));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setErrors({});
        start(async () => {
          const r = await saveStoreSettingsAction({ ...v, freeShippingThreshold: v.freeShippingThreshold || null });
          if (!r.ok) {
            setErrors(r.fieldErrors ?? {});
            return void toast.error(r.error);
          }
          toast.success(r.message);
        });
      }}
    >
      <FormSection title="Dados da loja" description="Aparecem no rodapé da loja e na confirmação dos pedidos.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="st-name" error={errors.name}>
            <Input id="st-name" value={v.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="WhatsApp" htmlFor="st-wa" optional error={errors.whatsapp}>
            <Input id="st-wa" inputMode="tel" value={v.whatsapp} onChange={(e) => set("whatsapp", maskPhone(e.target.value))} />
          </Field>
          <Field label="Telefone" htmlFor="st-phone" optional error={errors.phone}>
            <Input id="st-phone" inputMode="tel" value={v.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} />
          </Field>
          <Field label="E-mail" htmlFor="st-email" optional error={errors.email}>
            <Input id="st-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Instagram" htmlFor="st-ig" optional>
            <Input id="st-ig" value={v.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@usegazzeta" />
          </Field>
          <Field label="Endereço da loja física" htmlFor="st-addr" optional>
            <Input id="st-addr" value={v.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Foto da vitrine" description="Foto principal do topo da página inicial (formato retrato). Sem foto, a vitrine usa as peças em destaque.">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative aspect-[3/5] w-28 overflow-hidden rounded-t-full rounded-b-2xl bg-linen">
            {v.heroImageUrl ? <Image src={v.heroImageUrl} alt="Foto da vitrine" fill sizes="112px" className="object-cover" /> : null}
          </div>
          <div className="flex gap-2">
            <input
              ref={file}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setUploading(true);
                try {
                  set("heroImageUrl", await uploadImage(f));
                  toast.success("Foto enviada — salve para publicar.");
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setUploading(false);
                }
              }}
            />
            <Button type="button" variant="outline" onClick={() => file.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />} Enviar foto
            </Button>
            {v.heroImageUrl ? (
              <Button type="button" variant="ghost" onClick={() => set("heroImageUrl", "")}>
                <X /> Remover
              </Button>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Frete e parcelamento" description="Regras simples até integrar uma transportadora e um gateway de pagamento.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Frete fixo (R$)" htmlFor="st-ship" error={errors.shippingFlatRate}>
            <Input id="st-ship" inputMode="decimal" value={v.shippingFlatRate} onChange={(e) => set("shippingFlatRate", e.target.value)} />
          </Field>
          <Field label="Frete grátis a partir de (R$)" htmlFor="st-free" optional error={errors.freeShippingThreshold}>
            <Input id="st-free" inputMode="decimal" value={v.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", e.target.value)} />
          </Field>
          <Field label="Máximo de parcelas exibido" htmlFor="st-inst" error={errors.maxInstallments}>
            <Input id="st-inst" inputMode="numeric" value={v.maxInstallments} onChange={(e) => set("maxInstallments", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="Parcela mínima (R$)" htmlFor="st-minp" error={errors.minInstallmentValue}>
            <Input id="st-minp" inputMode="decimal" value={v.minInstallmentValue} onChange={(e) => set("minInstallmentValue", e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null} Salvar configurações
        </Button>
      </div>
    </form>
  );
}

export function UsersSection({
  users,
}: {
  users: { id: string; name: string; email: string; role: UserRole; active: boolean }[];
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SELLER" as UserRole });
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <FormSection
      title="Equipe"
      description="Perfis preparados: Administradora (tudo), Gerente, Vendedora (PDV, scanner, clientes) e Estoque (produtos, scanner, estoque)."
      action={
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
          <UserPlus /> Novo usuário
        </Button>
      }
    >
      <ul className="divide-y divide-hairline">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span>
              <span className="block font-semibold">{u.name}</span>
              <span className="block text-xs text-stone-ink">{u.email}</span>
            </span>
            <span className="rounded-full bg-sage-light px-3 py-1 text-xs font-semibold text-secondary-foreground">{ROLE_LABELS[u.role]}</span>
          </li>
        ))}
      </ul>
      {open ? (
        <form
          className="mt-4 grid gap-3 rounded-2xl bg-offwhite p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await createUserAction(form);
              if (!r.ok) return void toast.error(r.error);
              toast.success(r.message);
              setForm({ name: "", email: "", password: "", role: "SELLER" });
              setOpen(false);
            });
          }}
        >
          <Field label="Nome" htmlFor="u-name">
            <Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="E-mail" htmlFor="u-email">
            <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Senha inicial" htmlFor="u-pass" hint="Mínimo de 8 caracteres.">
            <Input id="u-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Perfil" htmlFor="u-role">
            <select id="u-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="h-10 w-full rounded-xl border border-input bg-paper px-3 text-sm">
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Criar usuário
            </Button>
          </div>
        </form>
      ) : null}
    </FormSection>
  );
}
