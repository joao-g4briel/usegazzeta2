"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="font-script text-5xl text-gold-ink">ops</p>
      <h1 className="mt-2 font-serif text-3xl font-medium">Algo não carregou como deveria</h1>
      <p className="mt-3 text-stone-ink">
        Pode ter sido uma instabilidade rápida. Tente de novo — sua sacola continua guardada.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={() => reset()}>Tentar de novo</Button>
        <Button asChild variant="outline">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
