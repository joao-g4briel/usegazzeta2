"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { loginAction } from "@/actions/auth-actions";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field label="E-mail" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state?.email}
          className="h-12"
        />
      </Field>
      <Field label="Senha" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-12" />
      </Field>
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-rose-mist px-4 py-3 text-sm font-medium text-rose-deep">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <LogIn />}
        Entrar
      </Button>
    </form>
  );
}
