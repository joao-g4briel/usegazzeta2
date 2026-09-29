import { LOW_STOCK_LAST_UNITS } from "@/lib/constants";

export type VariantAttributes = {
  color?: string | null;
  size?: string | null;
  tone?: string | null;
  volume?: string | null;
};

// "Amarelo / M", "100ml", "Rosé 02", ou "Padrão" quando a variante não tem atributos.
export function variantLabel(v: VariantAttributes, separator = " / "): string {
  const parts = [v.color, v.tone, v.size, v.volume]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));
  return parts.length ? parts.join(separator) : "Padrão";
}

// Linhas descritivas para carrinho/PDV: ["Cor: Amarelo", "Tamanho: M"].
export function variantDetails(v: VariantAttributes): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  if (v.color) out.push({ label: "Cor", value: v.color });
  if (v.size) out.push({ label: "Tamanho", value: v.size });
  if (v.tone) out.push({ label: "Tom", value: v.tone });
  if (v.volume) out.push({ label: "Volume", value: v.volume });
  return out;
}

export type StockState = "in_stock" | "last_units" | "last_unit" | "out_of_stock";

export function stockState(stock: number): StockState {
  if (stock <= 0) return "out_of_stock";
  if (stock === 1) return "last_unit";
  if (stock <= LOW_STOCK_LAST_UNITS) return "last_units";
  return "in_stock";
}

export const STOCK_STATE_LABELS: Record<StockState, string> = {
  in_stock: "Em estoque",
  last_units: "Últimas unidades",
  last_unit: "Última unidade",
  out_of_stock: "Esgotado",
};

// Alerta do painel: a variante está em nível crítico em relação ao mínimo dela.
export type AdminStockLevel = "ok" | "low" | "out";

export function adminStockLevel(stock: number, minimumStock: number): AdminStockLevel {
  if (stock <= 0) return "out";
  if (stock <= minimumStock) return "low";
  return "ok";
}

// Preço efetivo de venda: promocional quando menor que o preço cheio.
export function effectivePriceCents(saleCents: number, promoCents: number | null): number {
  if (promoCents !== null && promoCents > 0 && promoCents < saleCents) return promoCents;
  return saleCents;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// SKU legível: VFU-AMA-M
export function buildSku(productName: string, attrs: VariantAttributes): string {
  const words = slugify(productName).split("-").filter(Boolean);
  const base =
    words.length >= 3
      ? words.slice(0, 3).map((w) => w[0]).join("")
      : words.join("").slice(0, 3);
  const parts = [base.toUpperCase()];
  for (const value of [attrs.color, attrs.tone, attrs.size, attrs.volume]) {
    if (!value) continue;
    parts.push(slugify(value).replace(/-/g, "").slice(0, 3).toUpperCase());
  }
  if (parts.length === 1) parts.push("UN");
  return parts.join("-");
}
