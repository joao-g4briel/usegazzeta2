"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { lookupOrderAction } from "@/actions/store-actions";

export function OrderLookup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const result = await lookupOrderAction({ email, number: number.replace(/\D/g, "") });
          if (!result.ok) return setError(result.error);
          if (!result.data.id) return setError("Não encontramos um pedido com esse número e e-mail.");
          router.push(`/pedido/${result.data.id}`);
        });
      }}
    >
      <Field label="E-mail usado na compra" htmlFor="lookup-email">
        <Input id="lookup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Número do pedido" htmlFor="lookup-number" hint="Está na confirmação do pedido, ex.: 1284.">
        <Input
          id="lookup-number"
          inputMode="numeric"
          required
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="#1284"
        />
      </Field>
      {error ? (
        <p role="alert" className="rounded-xl bg-rose-mist px-4 py-3 text-sm font-medium text-rose-deep">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Ver meu pedido
      </Button>
    </form>
  );
}
