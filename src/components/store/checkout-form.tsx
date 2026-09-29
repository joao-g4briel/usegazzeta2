"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CreditCard, Loader2, Lock, QrCode, ShoppingBag, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { swatchFor } from "@/lib/constants";
import { BRAZIL_STATES, checkoutFormSchema, type CheckoutFormInput } from "@/lib/validations/order";
import { placeOrderAction } from "@/actions/store-actions";
import { EmptyState } from "@/components/shared/misc";
import { Field, maskCep, maskCpf, maskPhone } from "@/components/shared/field";
import { ProductImage } from "@/components/shared/product-image";
import { useCart } from "@/components/store/cart-provider";
import { useCartQuote } from "@/components/store/use-cart-quote";
import { readCheckoutPrefs, Summary } from "@/components/store/cart-view";

type ChoiceProps = {
  selected: boolean;
  onSelect: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

function Choice({ selected, onSelect, icon: Icon, title, description }: ChoiceProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
        selected ? "border-olive bg-sage-mist" : "border-hairline bg-paper hover:border-[#d6ccbb]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-olive text-offwhite" : "bg-linen text-olive",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-sm text-stone-ink">{description}</span>
      </span>
    </button>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const { lines, ready, clear } = useCart();
  const [coupon, setCoupon] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [cepLoading, setCepLoading] = useState(false);

  const form = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    shouldUnregister: true,
    defaultValues: {
      customer: { name: "", email: "", phone: "", whatsapp: "", cpf: "" },
      shippingMethod: "ENTREGA",
      paymentMethod: "PIX",
      notes: "",
    },
  });
  const { register, setValue, handleSubmit, formState, control } = form;
  const errors = formState.errors;
  const shippingMethod = useWatch({ control, name: "shippingMethod" });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });

  useEffect(() => {
    const prefs = readCheckoutPrefs();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preferências da sacola
    setCoupon(prefs.coupon);
    setValue("shippingMethod", prefs.shipping);
  }, [setValue]);

  const { quote, loading } = useCartQuote(lines, ready, coupon, shippingMethod);

  async function lookupCep(raw: string) {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (!data.erro) {
        if (data.logradouro) setValue("address.street", data.logradouro, { shouldValidate: true });
        if (data.bairro) setValue("address.district", data.bairro);
        if (data.localidade) setValue("address.city", data.localidade, { shouldValidate: true });
        if (data.uf) setValue("address.state", data.uf as (typeof BRAZIL_STATES)[number], { shouldValidate: true });
      }
    } catch {
      // Consulta de CEP indisponível: a cliente preenche manualmente.
    } finally {
      setCepLoading(false);
    }
  }

  const onSubmit = handleSubmit(
    (values) => {
    startTransition(async () => {
      const result = await placeOrderAction({
        ...values,
        // Cupom só vai se a cotação do servidor aceitou para esta sacola.
        couponCode: quote?.coupon ? coupon : null,
        items: lines,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      clear();
      try {
        sessionStorage.removeItem("ug-cupom");
      } catch {}
      router.push(`/pedido/${result.data.id}`);
    });
    },
    () => toast.error("Confira os campos destacados."),
  );

  if (ready && !lines.length) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="Sua sacola está vazia"
        description="Adicione peças à sacola para finalizar a compra."
        action={
          <Button asChild>
            <Link href="/produtos">Ver produtos</Link>
          </Button>
        }
      />
    );
  }

  const blocked = !quote || quote.lines.some((l) => l.issue === "unavailable") || !quote.itemCount;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <input type="hidden" {...register("shippingMethod")} />
      <input type="hidden" {...register("paymentMethod")} />
      <div className="flex flex-col gap-8">
        <section aria-labelledby="dados" className="space-y-5">
          <h2 id="dados" className="font-serif text-2xl font-semibold">Seus dados</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" htmlFor="name" error={errors.customer?.name?.message} className="sm:col-span-2">
              <Input id="name" autoComplete="name" {...register("customer.name")} aria-invalid={!!errors.customer?.name} />
            </Field>
            <Field label="E-mail" htmlFor="email" error={errors.customer?.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("customer.email")} aria-invalid={!!errors.customer?.email} />
            </Field>
            <Field label="Telefone" htmlFor="phone" error={errors.customer?.phone?.message}>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(81) 99999-9999"
                {...register("customer.phone", { onChange: (e) => (e.target.value = maskPhone(e.target.value)) })}
                aria-invalid={!!errors.customer?.phone}
              />
            </Field>
            <Field label="WhatsApp" htmlFor="whatsapp" optional error={errors.customer?.whatsapp?.message} hint="Se for diferente do telefone.">
              <Input
                id="whatsapp"
                type="tel"
                inputMode="tel"
                placeholder="(81) 99999-9999"
                {...register("customer.whatsapp", { onChange: (e) => (e.target.value = maskPhone(e.target.value)) })}
              />
            </Field>
            <Field label="CPF" htmlFor="cpf" optional error={errors.customer?.cpf?.message}>
              <Input
                id="cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                {...register("customer.cpf", { onChange: (e) => (e.target.value = maskCpf(e.target.value)) })}
              />
            </Field>
          </div>
        </section>

        <section aria-labelledby="entrega" className="space-y-5">
          <h2 id="entrega" className="font-serif text-2xl font-semibold">Entrega</h2>
          <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
            <Choice
              selected={shippingMethod === "ENTREGA"}
              onSelect={() => setValue("shippingMethod", "ENTREGA")}
              icon={Truck}
              title="Receber em casa"
              description="Enviamos para todo o Brasil."
            />
            <Choice
              selected={shippingMethod === "RETIRADA"}
              onSelect={() => setValue("shippingMethod", "RETIRADA")}
              icon={Store}
              title="Retirar na loja"
              description="Sem custo de frete."
            />
          </div>
          {shippingMethod === "ENTREGA" ? (
            <div className="grid gap-4 sm:grid-cols-6">
              <Field label="CEP" htmlFor="cep" error={errors.address?.zipCode?.message} className="sm:col-span-2">
                <div className="relative">
                  <Input
                    id="cep"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    {...register("address.zipCode", {
                      onChange: (e) => {
                        e.target.value = maskCep(e.target.value);
                        if (e.target.value.length === 9) lookupCep(e.target.value);
                      },
                    })}
                  />
                  {cepLoading ? (
                    <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-stone-ink" />
                  ) : null}
                </div>
              </Field>
              <Field label="Rua" htmlFor="street" error={errors.address?.street?.message} className="sm:col-span-4">
                <Input id="street" autoComplete="address-line1" {...register("address.street")} />
              </Field>
              <Field label="Número" htmlFor="number" error={errors.address?.number?.message} className="sm:col-span-2">
                <Input id="number" {...register("address.number")} />
              </Field>
              <Field label="Complemento" htmlFor="complement" optional className="sm:col-span-4">
                <Input id="complement" autoComplete="address-line2" {...register("address.complement")} />
              </Field>
              <Field label="Bairro" htmlFor="district" optional className="sm:col-span-2">
                <Input id="district" {...register("address.district")} />
              </Field>
              <Field label="Cidade" htmlFor="city" error={errors.address?.city?.message} className="sm:col-span-3">
                <Input id="city" autoComplete="address-level2" {...register("address.city")} />
              </Field>
              <Field label="Estado" htmlFor="state" error={errors.address?.state?.message} className="sm:col-span-1">
                <select
                  id="state"
                  {...register("address.state")}
                  className="h-10 w-full rounded-xl border border-input bg-paper px-2 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    UF
                  </option>
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="pagamento" className="space-y-5">
          <h2 id="pagamento" className="font-serif text-2xl font-semibold">Pagamento</h2>
          <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
            <Choice
              selected={paymentMethod === "PIX"}
              onSelect={() => setValue("paymentMethod", "PIX")}
              icon={QrCode}
              title="Pix"
              description="Aprovação rápida após a confirmação."
            />
            <Choice
              selected={paymentMethod === "CREDITO"}
              onSelect={() => setValue("paymentMethod", "CREDITO")}
              icon={CreditCard}
              title="Cartão de crédito"
              description="Parcelamento combinado com a loja."
            />
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-cream px-4 py-3 text-sm text-stone-ink">
            <Lock className="mt-0.5 size-4 shrink-0 text-olive" />
            Suas peças ficam reservadas assim que o pedido é feito. A loja confirma o pagamento com você e o
            pedido segue para separação.
          </p>
          <Field label="Observações" htmlFor="notes" optional>
            <Textarea id="notes" rows={3} {...register("notes")} className="rounded-xl bg-paper" />
          </Field>
        </section>
      </div>

      <aside className="rounded-3xl bg-cream p-6 lg:sticky lg:top-36">
        <h2 className="font-serif text-2xl font-semibold">Seu pedido</h2>
        <ul className="mt-4 max-h-72 space-y-4 overflow-y-auto pr-1">
          {quote?.lines.map((l) => (
            <li key={l.variantId} className="flex gap-3">
              <ProductImage
                src={l.image}
                alt={l.productName}
                kind={l.variantKind}
                tint={swatchFor(l.details.find((d) => d.label === "Cor")?.value)}
                monogram={false}
                sizes="64px"
                className="aspect-[4/5] w-14 shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-ink">{l.productName}</p>
                <p className="text-stone-ink">{l.details.map((d) => `${d.label}: ${d.value}`).join(" · ") || "Padrão"}</p>
                {l.issue ? (
                  <p className="text-xs font-medium text-rose-deep">
                    {l.issue === "unavailable" ? "Esgotado — volte à sacola" : `Só ${l.stock} disponíveis`}
                  </p>
                ) : null}
              </div>
              <p className="text-sm font-semibold tabular">
                {l.quantity} × {formatBRL(l.unitPrice)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-hairline pt-5">
          <Summary quote={quote} loading={loading} />
          {coupon && quote?.couponError ? (
            <p className="mt-3 rounded-lg bg-rose-mist px-3 py-2 text-xs font-medium text-rose-deep">
              Cupom {coupon} não aplicado: {quote.couponError}
            </p>
          ) : null}
        </div>
        <Button type="submit" size="lg" className="mt-6 h-14 w-full" disabled={pending || blocked}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? "Enviando pedido…" : "Confirmar pedido"}
        </Button>
        <Link href="/carrinho" className="mt-3 block text-center text-sm font-medium text-olive hover:underline">
          Voltar à sacola
        </Link>
      </aside>
    </form>
  );
}
