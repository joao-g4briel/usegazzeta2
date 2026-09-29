"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { APPAREL_SIZES, COLOR_SWATCHES, FRAGRANCE_VOLUMES, swatchFor, type VariantKind } from "@/lib/constants";
import { variantLabel } from "@/lib/variant";

export type GeneratedVariant = {
  color: string | null;
  size: string | null;
  tone: string | null;
  volume: string | null;
};

const COLOR_SUGGESTIONS = ["Amarelo", "Rosa", "Verde", "Preto", "Branco", "Off-white", "Bege", "Vermelho", "Vinho", "Lilás", "Nude", "Dourado", "Prata"];

function ChipInput({
  values,
  onChange,
  placeholder,
  suggestions,
  swatches,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  suggestions?: string[];
  swatches?: boolean;
}) {
  const [draft, setDraft] = useState("");
  function add(raw: string) {
    const value = raw.trim().replace(/\s+/g, " ");
    if (!value) return;
    const pretty = value.charAt(0).toUpperCase() + value.slice(1);
    if (!values.some((v) => v.toLowerCase() === pretty.toLowerCase())) onChange([...values, pretty]);
    setDraft("");
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    }
  }
  const available = (suggestions ?? []).filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span key={v} className="inline-flex h-9 items-center gap-2 rounded-full bg-sage-light pr-1.5 pl-3 text-sm font-medium text-secondary-foreground">
            {swatches ? (
              <span className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: swatchFor(v) ?? "#ddd" }} />
            ) : null}
            {v}
            <button type="button" aria-label={`Remover ${v}`} onClick={() => onChange(values.filter((x) => x !== v))} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-white/60">
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <div className="flex gap-1.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            className="h-9 w-40"
          />
          <Button type="button" size="icon-sm" variant="outline" onClick={() => add(draft)} aria-label="Adicionar">
            <Plus />
          </Button>
        </div>
      </div>
      {available.length ? (
        <div className="flex flex-wrap gap-1.5">
          {available.slice(0, 10).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-dashed border-[#d6ccbb] px-2.5 text-xs text-stone-ink hover:border-olive hover:text-olive"
            >
              {swatches && COLOR_SWATCHES[s.toLowerCase()] ? (
                <span className="size-2.5 rounded-full" style={{ backgroundColor: COLOR_SWATCHES[s.toLowerCase()] }} />
              ) : null}
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ToggleChips({ options, values, onChange }: { options: readonly string[]; values: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = values.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? values.filter((v) => v !== o) : [...values, o])}
            className={cn(
              "inline-flex h-10 min-w-12 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors",
              on ? "border-olive bg-olive text-offwhite" : "border-hairline bg-paper text-ink hover:border-sage",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Gerador de variantes: cores × tamanhos (roupas), volumes (perfumes), tons (maquiagem)…
 * Ex.: Amarelo, Rosa × P, M, G → 6 variantes.
 */
export function VariantGenerator({
  kind,
  existing,
  onGenerate,
}: {
  kind: VariantKind;
  existing: GeneratedVariant[];
  onGenerate: (rows: GeneratedVariant[]) => void;
}) {
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [extraSizes, setExtraSizes] = useState<string[]>([]);
  const [volumes, setVolumes] = useState<string[]>([]);
  const [tones, setTones] = useState<string[]>([]);

  const combos: GeneratedVariant[] = [];
  const empty = { color: null, size: null, tone: null, volume: null };
  if (kind === "APPAREL") {
    const allSizes = [...sizes, ...extraSizes];
    for (const c of colors.length ? colors : [null]) {
      for (const s of allSizes.length ? allSizes : [null]) {
        if (c || s) combos.push({ ...empty, color: c, size: s });
      }
    }
  } else if (kind === "FRAGRANCE") {
    for (const v of volumes) combos.push({ ...empty, volume: v });
  } else if (kind === "BEAUTY") {
    for (const t of tones) combos.push({ ...empty, tone: t });
  } else if (kind === "ACCESSORY") {
    for (const c of colors) combos.push({ ...empty, color: c });
  }
  const existingLabels = new Set(existing.map((e) => variantLabel(e).toLowerCase()));
  const fresh = combos.filter((c) => !existingLabels.has(variantLabel(c).toLowerCase()));

  if (kind === "OTHER") {
    return (
      <p className="rounded-xl bg-cream px-4 py-3 text-sm text-stone-ink">
        Produtos sem cor, tamanho ou volume usam uma única variante <strong className="text-ink">Padrão</strong> —
        ela carrega o SKU, o código de barras e o estoque.
      </p>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl bg-cream p-5">
      {kind === "APPAREL" || kind === "ACCESSORY" ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Cores</p>
          <ChipInput values={colors} onChange={setColors} placeholder="Nova cor" suggestions={COLOR_SUGGESTIONS} swatches />
        </div>
      ) : null}
      {kind === "APPAREL" ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Tamanhos</p>
          <ToggleChips options={APPAREL_SIZES} values={sizes} onChange={setSizes} />
          <ChipInput values={extraSizes} onChange={setExtraSizes} placeholder="Outro (ex.: 38)" />
        </div>
      ) : null}
      {kind === "FRAGRANCE" ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Volumes</p>
          <ToggleChips options={FRAGRANCE_VOLUMES} values={volumes} onChange={setVolumes} />
          <ChipInput values={volumes.filter((v) => !(FRAGRANCE_VOLUMES as readonly string[]).includes(v))} onChange={(v) => setVolumes([...volumes.filter((x) => (FRAGRANCE_VOLUMES as readonly string[]).includes(x)), ...v])} placeholder="Outro (ex.: 90ml)" />
        </div>
      ) : null}
      {kind === "BEAUTY" ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Tons / cores / números</p>
          <ChipInput values={tones} onChange={setTones} placeholder="Ex.: Nude 01" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e6dccb] pt-4">
        <p className="text-sm text-stone-ink">
          {combos.length
            ? `${combos.length} combinações · ${fresh.length} ${fresh.length === 1 ? "nova" : "novas"}`
            : "Escolha as opções para gerar as variantes."}
        </p>
        <Button type="button" variant="soft" disabled={!fresh.length} onClick={() => onGenerate(fresh)}>
          <Sparkles /> Gerar {fresh.length || ""} {fresh.length === 1 ? "variante" : "variantes"}
        </Button>
      </div>
    </div>
  );
}
