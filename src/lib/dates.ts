import { STORE_TIMEZONE, STORE_UTC_OFFSET_HOURS } from "@/lib/constants";

const OFFSET_MS = STORE_UTC_OFFSET_HOURS * 60 * 60 * 1000;

// Início do dia no fuso da loja, devolvido como instante UTC.
export function startOfStoreDay(date = new Date()): Date {
  const local = new Date(date.getTime() + OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function startOfStoreMonth(date = new Date()): Date {
  const local = new Date(date.getTime() + OFFSET_MS);
  local.setUTCDate(1);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET_MS);
}

export function startOfStoreYear(date = new Date()): Date {
  const local = new Date(date.getTime() + OFFSET_MS);
  local.setUTCMonth(0, 1);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET_MS);
}

export function addMonths(date: Date, months: number): Date {
  const local = new Date(date.getTime() + OFFSET_MS);
  local.setUTCMonth(local.getUTCMonth() + months);
  return new Date(local.getTime() - OFFSET_MS);
}

// Chave YYYY-MM-DD do dia no fuso da loja.
export function storeDayKey(date: Date): string {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

export function storeMonthKey(date: Date): string {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 7);
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: STORE_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: STORE_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const longDateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: STORE_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function formatDate(date: Date | string): string {
  return dateFmt.format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFmt.format(new Date(date)).replace(",", "");
}

export function formatLongDate(date: Date | string): string {
  return longDateFmt.format(new Date(date));
}

// "16/08" a partir de "2026-08-16"
export function shortDayLabel(dayKey: string): string {
  const [, m, d] = dayKey.split("-");
  return `${d}/${m}`;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export function shortMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  return `${MONTHS[Number(m) - 1]}/${y.slice(2)}`;
}

export type PeriodKey = "hoje" | "7d" | "30d" | "mes" | "mes-passado" | "ano";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  hoje: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  mes: "Este mês",
  "mes-passado": "Mês passado",
  ano: "Ano",
};

export function periodRange(period: PeriodKey, now = new Date()): { from: Date; to: Date } {
  const today = startOfStoreDay(now);
  const tomorrow = addDays(today, 1);
  switch (period) {
    case "hoje":
      return { from: today, to: tomorrow };
    case "7d":
      return { from: addDays(today, -6), to: tomorrow };
    case "30d":
      return { from: addDays(today, -29), to: tomorrow };
    case "mes":
      return { from: startOfStoreMonth(now), to: tomorrow };
    case "mes-passado": {
      const thisMonth = startOfStoreMonth(now);
      return { from: addMonths(thisMonth, -1), to: thisMonth };
    }
    case "ano":
      return { from: startOfStoreYear(now), to: tomorrow };
  }
}

export function isPeriodKey(value: unknown): value is PeriodKey {
  return typeof value === "string" && value in PERIOD_LABELS;
}
