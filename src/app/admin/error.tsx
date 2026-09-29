"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
      <h1 className="font-serif text-3xl font-medium">Não foi possível carregar esta tela</h1>
      <p className="mt-3 text-stone-ink">
        Verifique a conexão com o banco de dados e tente novamente.
        {error.digest ? <span className="mt-1 block text-xs">Código: {error.digest}</span> : null}
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Tentar de novo
      </Button>
    </div>
  );
}
