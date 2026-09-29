"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, Loader2, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { swatchFor } from "@/lib/constants";
import { ProductImage } from "@/components/shared/product-image";
import { searchVariantsAction } from "@/actions/inventory-actions";
import { posCatalogAction } from "@/actions/sale-actions";
import type { PosVariant } from "@/types/catalog";

function VariantRow({ v, onPick }: { v: PosVariant; onPick: (v: PosVariant) => void }) {
  const out = v.stock <= 0;
  return (
    <button
      type="button"
      disabled={out}
      onClick={() => onPick(v)}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-linen disabled:opacity-50"
    >
      <ProductImage
        src={v.image}
        alt={v.productName}
        kind={v.variantKind}
        tint={swatchFor(v.details.find((d) => d.label === "Cor")?.value, v.colorHex)}
        monogram={false}
        sizes="48px"
        className="size-12 shrink-0 rounded-lg"
        artClassName="h-[80%]"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{v.productName}</span>
        <span className="block truncate text-xs text-stone-ink">
          {v.label} · {out ? "esgotado" : `${v.stock} em estoque`}
        </span>
      </span>
      <span className="text-sm font-bold tabular">{formatBRL(v.price)}</span>
    </button>
  );
}

export function ProductSearch({ onPick }: { onPick: (v: PosVariant) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PosVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await searchVariantsAction(term);
      setLoading(false);
      if (r.ok) setResults(r.data);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const show = open && q.trim().length >= 2;

  return (
    <div ref={box} className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-ink" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar produto, SKU ou código"
        aria-label="Buscar produto"
        className="h-14 w-full rounded-2xl border border-hairline bg-paper pr-11 pl-12 text-base shadow-soft outline-none placeholder:text-stone-ink focus:border-sage"
      />
      {q ? (
        <button type="button" onClick={() => setQ("")} aria-label="Limpar" className="absolute top-1/2 right-3 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-linen">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
        </button>
      ) : null}
      {show ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-30 max-h-[60dvh] overflow-y-auto rounded-2xl border border-hairline bg-paper p-1.5 shadow-lift">
          {results.length ? (
            results.map((v) => (
              <VariantRow
                key={v.variantId}
                v={v}
                onPick={(picked) => {
                  onPick(picked);
                  setQ("");
                  setOpen(false);
                }}
              />
            ))
          ) : (
            <p className="px-3 py-6 text-center text-sm text-stone-ink">{loading ? "Buscando…" : "Nenhum produto encontrado."}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

// Catálogo por categoria para vender sem código de barras.
export function CatalogSheet({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (v: PosVariant) => void;
}) {
  const [all, setAll] = useState<PosVariant[] | null>(null);
  const [category, setCategory] = useState<string>("Todos");

  useEffect(() => {
    if (!open || all) return;
    posCatalogAction().then((r) => setAll(r.ok ? r.data : []));
  }, [open, all]);

  const categories = useMemo(() => ["Todos", ...new Set((all ?? []).map((v) => v.categoryName))], [all]);
  const grouped = useMemo(() => {
    const list = (all ?? []).filter((v) => category === "Todos" || v.categoryName === category);
    const map = new Map<string, PosVariant[]>();
    for (const v of list) map.set(v.productName, [...(map.get(v.productName) ?? []), v]);
    return [...map.entries()];
  }, [all, category]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md border-none bg-offwhite p-0 sm:max-w-md">
        <div className="border-b border-hairline px-5 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-2 font-serif text-2xl">
            <LayoutGrid className="size-5 text-olive" /> Catálogo
          </SheetTitle>
          <SheetDescription>Toque na variante para adicionar ao carrinho.</SheetDescription>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "h-9 shrink-0 rounded-xl border px-3.5 text-sm font-medium",
                  category === c ? "border-olive bg-olive text-offwhite" : "border-hairline bg-paper",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-8">
          {!all ? (
            <p className="py-10 text-center text-sm text-stone-ink">Carregando catálogo…</p>
          ) : (
            grouped.map(([name, variants]) => (
              <section key={name} className="border-b border-hairline py-3">
                <p className="px-2 pb-1 text-xs font-bold tracking-[0.08em] text-stone-ink uppercase">{name}</p>
                {variants.map((v) => (
                  <VariantRow key={v.variantId} v={v} onPick={onPick} />
                ))}
              </section>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
