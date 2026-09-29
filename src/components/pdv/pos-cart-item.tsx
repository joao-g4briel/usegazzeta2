"use client";

import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { swatchFor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/shared/product-image";
import { usePos, type PosLine } from "@/components/pdv/pos-provider";

// Linha do carrinho do PDV: mostra exatamente a variante ("Tamanho: M | Cor: Amarelo").
export function PosCartItem({ line, fresh }: { line: PosLine; fresh?: boolean }) {
  const { setQuantity, remove } = usePos();
  const { variant, quantity } = line;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(quantity));
  const tint = swatchFor(variant.details.find((d) => d.label === "Cor")?.value, variant.colorHex);

  return (
    <li
      className={cn(
        "relative flex gap-3 rounded-2xl border border-hairline bg-paper p-2.5 shadow-soft sm:gap-4 sm:p-3",
        fresh && "animate-pop-in ring-2 ring-sage/60",
      )}
    >
      <ProductImage
        src={variant.image}
        alt={variant.productName}
        kind={variant.variantKind}
        tint={tint}
        monogram={false}
        sizes="120px"
        className="aspect-[4/5] w-[5.5rem] shrink-0 rounded-xl sm:w-28"
        artClassName="h-[76%]"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="pr-10">
          <p className="font-serif text-[1.2rem] leading-tight font-semibold text-ink sm:text-[1.35rem]">{variant.productName}</p>
          <p className="text-sm text-olive">{variant.categoryName}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-[0.82rem] text-stone-ink">
            {variant.details.length ? (
              variant.details.map((d, i) => (
                <span key={d.label} className="whitespace-nowrap">
                  {i > 0 ? <span className="mr-2 text-[#cfc6b6]">|</span> : null}
                  {d.label}: <span className="text-ink">{d.value}</span>
                </span>
              ))
            ) : (
              <span>Padrão</span>
            )}
          </p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex h-11 items-center rounded-xl bg-sage-light/70">
            <button
              type="button"
              onClick={() => setQuantity(variant.variantId, quantity - 1)}
              aria-label={`Diminuir ${variant.productName}`}
              className="inline-flex size-11 items-center justify-center text-ink"
            >
              <Minus className="size-4" />
            </button>
            {editing ? (
              <input
                autoFocus
                inputMode="numeric"
                value={draft}
                onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
                onBlur={() => {
                  setEditing(false);
                  const n = Number(draft);
                  if (Number.isInteger(n)) setQuantity(variant.variantId, n);
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                aria-label="Quantidade"
                className="h-9 w-11 rounded-lg bg-paper text-center font-semibold tabular outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraft(String(quantity));
                  setEditing(true);
                }}
                aria-label={`Quantidade ${quantity}, toque para editar`}
                className="h-9 w-11 rounded-lg bg-paper text-center font-semibold tabular"
              >
                {quantity}
              </button>
            )}
            <button
              type="button"
              onClick={() => setQuantity(variant.variantId, quantity + 1)}
              disabled={quantity >= variant.stock}
              aria-label={`Aumentar ${variant.productName}`}
              className="inline-flex size-11 items-center justify-center text-ink disabled:text-stone/40"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="text-right">
            {quantity > 1 ? (
              <p className="text-xs text-stone-ink tabular">
                {quantity} × {formatBRL(variant.price)}
              </p>
            ) : null}
            <p className="font-serif text-[1.35rem] leading-none font-semibold text-ink tabular sm:text-[1.55rem]">
              {formatBRL(variant.price * quantity)}
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => remove(variant.variantId)}
        aria-label={`Remover ${variant.productName} ${variant.label}`}
        className="absolute top-2.5 right-2.5 inline-flex size-9 items-center justify-center rounded-full bg-linen text-ink hover:bg-beige"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}
