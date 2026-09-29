import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/shared/wordmark";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-cream px-4 py-20 text-center">
      <Wordmark tone="olive" size="sm" />
      <p className="mt-10 font-serif text-[5rem] leading-none font-medium text-sage">404</p>
      <h1 className="mt-3 font-serif text-3xl font-medium">Esta página saiu da vitrine</h1>
      <p className="mt-3 max-w-sm text-stone-ink">
        O endereço pode ter mudado ou a peça não está mais disponível.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/produtos">Ver produtos</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Página inicial</Link>
        </Button>
      </div>
    </div>
  );
}
