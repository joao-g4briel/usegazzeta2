"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { Wordmark } from "@/components/shared/wordmark";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/store/cart-provider";
import { useIsClient } from "@/hooks/use-is-client";

export const STORE_MENU = [
  { label: "Roupas", href: "/categoria/roupas" },
  { label: "Maquiagens", href: "/categoria/maquiagens" },
  { label: "Perfumes", href: "/categoria/perfumes" },
  { label: "Novidades", href: "/produtos?filtro=novidades" },
  { label: "Looks", href: "/produtos?filtro=looks" },
  { label: "Ofertas", href: "/produtos?filtro=ofertas", accent: true },
];

function SearchForm({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  function submit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/produtos?q=${encodeURIComponent(term)}` : "/produtos");
  }
  return (
    <form role="search" onSubmit={submit} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-[1.05rem] -translate-y-1/2 text-stone-ink" />
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="O que você procura hoje?"
        aria-label="Buscar produtos"
        className="h-11 w-full rounded-full border border-white/70 bg-paper pr-4 pl-11 text-[0.95rem] text-ink shadow-[0_1px_0_rgb(23_26_24/0.04)] outline-none placeholder:text-stone-ink focus-visible:ring-3 focus-visible:ring-white/60"
      />
    </form>
  );
}

function CartButton() {
  const { count, ready: loaded } = useCart();
  const ready = useIsClient() && loaded;
  return (
    <Link
      href="/carrinho"
      aria-label={`Sacola${ready && count ? `, ${count} ${count === 1 ? "item" : "itens"}` : ""}`}
      className="relative inline-flex size-11 items-center justify-center rounded-full text-offwhite transition-colors hover:bg-white/15"
    >
      <ShoppingBag className="size-[1.4rem]" strokeWidth={1.6} />
      <span
        className={cn(
          "absolute top-1 right-0.5 flex min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.7rem] leading-5 font-bold text-ink tabular transition-transform",
          ready && count ? "scale-100" : "scale-0",
        )}
      >
        {ready ? count : 0}
      </span>
    </Link>
  );
}

export function StoreHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-sage">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:h-[4.5rem] sm:px-6 lg:gap-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="inline-flex size-11 items-center justify-center rounded-full text-offwhite hover:bg-white/15 lg:hidden"
              >
                <Menu className="size-6" strokeWidth={1.6} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-sm border-none bg-offwhite p-0" showCloseButton={false}>
              <SheetTitle className="sr-only">Menu da loja</SheetTitle>
              <div className="flex h-16 items-center justify-between bg-sage px-5">
                <Wordmark tone="light" size="sm" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="inline-flex size-10 items-center justify-center rounded-full text-offwhite hover:bg-white/15"
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="flex flex-col px-3 py-4">
                {STORE_MENU.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-3.5 font-serif text-[1.45rem] font-medium text-ink hover:bg-linen",
                      item.accent && "text-gold-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/categoria/acessorios"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3.5 font-serif text-[1.45rem] font-medium text-ink hover:bg-linen"
                >
                  Acessórios
                </Link>
              </nav>
              <div className="mx-5 border-t border-hairline pt-4 text-sm">
                <Link href="/conta" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 text-ink">
                  <UserRound className="size-4 text-olive" /> Minha conta · acompanhar pedido
                </Link>
                <Link href="/favoritos" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 text-ink">
                  <Heart className="size-4 text-olive" /> Favoritos
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" aria-label="Use Gazzeta — página inicial" className="mx-auto shrink-0 lg:mx-0">
            <Wordmark tone="light" size="md" className="max-sm:scale-90" />
          </Link>

          <SearchForm className="hidden max-w-xl flex-1 md:block" />

          <nav aria-label="Conta" className="flex items-center gap-0.5 lg:ml-auto">
            <Link
              href="/conta"
              aria-label="Minha conta"
              className="hidden size-11 items-center justify-center rounded-full text-offwhite hover:bg-white/15 sm:inline-flex"
            >
              <UserRound className="size-[1.35rem]" strokeWidth={1.6} />
            </Link>
            <Link
              href="/favoritos"
              aria-label="Favoritos"
              className="hidden size-11 items-center justify-center rounded-full text-offwhite hover:bg-white/15 sm:inline-flex"
            >
              <Heart className="size-[1.35rem]" strokeWidth={1.6} />
            </Link>
            <CartButton />
          </nav>
        </div>
        <div className="px-4 pb-3 md:hidden">
          <SearchForm />
        </div>
      </div>

      <nav
        aria-label="Categorias"
        className="hidden border-b border-hairline bg-offwhite/95 backdrop-blur-sm lg:block"
      >
        <ul className="mx-auto flex h-12 max-w-[1320px] items-center justify-center gap-12 px-6 text-[0.9rem] font-medium">
          {STORE_MENU.map((item) => {
            const active = pathname === item.href.split("?")[0] && !item.href.includes("?");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative py-3 transition-colors hover:text-olive",
                    item.accent ? "text-gold-ink" : "text-ink",
                    active && "text-olive after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-olive",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
