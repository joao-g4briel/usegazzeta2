import { APPAREL_SIZES } from "@/lib/constants";

// Seleção de variante genérica: funciona para cor+tamanho, tom, volume ou "Padrão".

export type Dim = "color" | "tone" | "size" | "volume";
export const DIM_ORDER: Dim[] = ["color", "tone", "size", "volume"];
export const DIM_LABELS: Record<Dim, string> = {
  color: "Cor",
  tone: "Tom",
  size: "Tamanho",
  volume: "Volume",
};

type SelectableVariant = {
  id: string;
  color: string | null;
  tone: string | null;
  size: string | null;
  volume: string | null;
  stock: number;
};

export type Selection = Partial<Record<Dim, string>>;

export function dimsOf(variants: SelectableVariant[]): Dim[] {
  return DIM_ORDER.filter((d) => variants.some((v) => v[d]));
}

function volumeValue(v: string) {
  return Number.parseFloat(v.replace(",", ".")) || 0;
}

export function optionsFor(variants: SelectableVariant[], dim: Dim): string[] {
  const seen: string[] = [];
  for (const v of variants) {
    const value = v[dim];
    if (value && !seen.includes(value)) seen.push(value);
  }
  if (dim === "size") {
    const order = APPAREL_SIZES as readonly string[];
    return seen.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }
  if (dim === "volume") return seen.sort((a, b) => volumeValue(a) - volumeValue(b));
  return seen;
}

function matchesOthers(v: SelectableVariant, selection: Selection, except: Dim) {
  return (Object.entries(selection) as [Dim, string | undefined][]).every(
    ([dim, value]) => dim === except || !value || v[dim] === value,
  );
}

export type OptionState = "available" | "sold_out" | "unavailable";

export function optionState(
  variants: SelectableVariant[],
  selection: Selection,
  dim: Dim,
  value: string,
): OptionState {
  const candidates = variants.filter((v) => v[dim] === value && matchesOthers(v, selection, dim));
  if (!candidates.length) return "unavailable";
  return candidates.some((v) => v.stock > 0) ? "available" : "sold_out";
}

export function findVariant<T extends SelectableVariant>(
  variants: T[],
  selection: Selection,
  dims: Dim[],
): T | null {
  if (!variants.length) return null;
  if (!dims.length) return variants[0];
  if (dims.some((d) => !selection[d])) return null;
  return variants.find((v) => dims.every((d) => v[d] === selection[d])) ?? null;
}

// Pré-seleção: roupas escolhem só a cor (tamanho fica com a cliente);
// demais categorias já abrem na primeira variante disponível.
export function initialSelection(variants: SelectableVariant[], apparel: boolean): Selection {
  const dims = dimsOf(variants);
  const first = variants.find((v) => v.stock > 0) ?? variants[0];
  if (!first) return {};
  const selection: Selection = {};
  for (const d of dims) {
    if (apparel && d === "size" && dims.length > 1) continue;
    if (first[d]) selection[d] = first[d]!;
  }
  return selection;
}
