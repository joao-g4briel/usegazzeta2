// Dinheiro é calculado em centavos inteiros para evitar erros de ponto flutuante.
// O banco guarda Decimal(10,2); a conversão acontece nos serviços.

type DecimalLike = { toString(): string } | number | string | null | undefined;

export function toCents(value: DecimalLike): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function toNumber(value: DecimalLike): number {
  return toCents(value) / 100;
}

export function toNumberOrNull(value: DecimalLike): number | null {
  if (value === null || value === undefined) return null;
  return toNumber(value);
}

export function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number): string {
  return brl.format(value).replace(/ /g, " ");
}

export function formatCents(cents: number): string {
  return formatBRL(cents / 100);
}

// Aceita "1.234,56", "1234,56", "1234.56" ou número.
export function parseMoney(input: string | number): number {
  if (typeof input === "number") return input;
  const clean = input.replace(/[^\d,.-]/g, "");
  if (clean.includes(",")) {
    return Number(clean.replace(/\./g, "").replace(",", "."));
  }
  return Number(clean);
}

export function installmentsFor(
  price: number,
  maxInstallments: number,
  minInstallment: number,
): { count: number; value: number } | null {
  if (price <= 0) return null;
  const byMin = Math.floor(price / Math.max(minInstallment, 1));
  const count = Math.max(1, Math.min(maxInstallments, byMin));
  if (count < 2) return null;
  return { count, value: Math.round((price / count) * 100) / 100 };
}
