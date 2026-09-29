"use client";

import { cn } from "@/lib/utils";
import { swatchFor } from "@/lib/constants";
import {
  DIM_LABELS,
  optionState,
  optionsFor,
  type Dim,
  type Selection,
} from "@/lib/variant-selection";
import type { PublicVariantDTO } from "@/types/catalog";

// Botões de variante. Esgotada continua visível, riscada e desabilitada;
// o produto só é "esgotado" quando todas as variantes estão.
export function VariantOptions({
  variants,
  dims,
  selection,
  onSelect,
  compact,
}: {
  variants: PublicVariantDTO[];
  dims: Dim[];
  selection: Selection;
  onSelect: (dim: Dim, value: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-5")}>
      {dims.map((dim) => {
        const options = optionsFor(variants, dim);
        return (
          <fieldset key={dim} className="min-w-0">
            <legend className={cn("mb-2 text-sm text-stone-ink", compact && "mb-1.5 text-xs")}>
              {DIM_LABELS[dim]}
              {selection[dim] ? <span className="ml-1.5 font-semibold text-ink">{selection[dim]}</span> : null}
            </legend>
            <div className="flex flex-wrap gap-2">
              {options.map((value) => {
                const state = optionState(variants, selection, dim, value);
                const selected = selection[dim] === value;
                const disabled = state !== "available";
                const swatch = dim === "color" ? swatchFor(value) : null;
                const priceHint =
                  dim === "volume"
                    ? variants.find((v) => v.volume === value)?.price
                    : undefined;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={`${DIM_LABELS[dim]} ${value}${state === "sold_out" ? ", esgotado" : state === "unavailable" ? ", indisponível nesta combinação" : ""}`}
                    onClick={() => onSelect(dim, value)}
                    className={cn(
                      "relative inline-flex items-center gap-2 rounded-full border text-sm font-medium transition-[background-color,border-color,color] duration-150",
                      compact ? "h-9 px-3.5" : "h-11 px-4",
                      dim === "size" && (compact ? "min-w-10 justify-center px-2.5" : "min-w-12 justify-center px-3"),
                      selected
                        ? "border-olive bg-olive text-offwhite"
                        : "border-[#d9d0c1] bg-paper text-ink hover:border-olive",
                      disabled &&
                        "cursor-not-allowed border-dashed bg-transparent text-stone-ink/80 hover:border-[#d9d0c1]",
                    )}
                  >
                    {swatch ? (
                      <span
                        aria-hidden
                        className={cn("size-3.5 rounded-full ring-1 ring-black/10", disabled && "opacity-40")}
                        style={{ backgroundColor: swatch }}
                      />
                    ) : null}
                    <span className={cn(state === "sold_out" && "line-through decoration-1")}>{value}</span>
                    {priceHint !== undefined && !compact ? (
                      <span className={cn("text-xs tabular", selected ? "text-offwhite/80" : "text-stone-ink")}>
                        {priceHint.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    ) : null}
                    {state === "sold_out" && !compact ? (
                      <span className="sr-only">esgotado</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
