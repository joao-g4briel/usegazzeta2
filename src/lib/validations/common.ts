import { z } from "zod";
import { checkBarcode } from "@/lib/barcode";
import { parseMoney } from "@/lib/money";

export const idSchema = z.string().min(1, "Identificador obrigatório.");

// Aceita número ou texto no formato brasileiro ("89,90").
export const moneySchema = z
  .union([z.number(), z.string()])
  .transform((v, ctx) => {
    const n = parseMoney(v);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: "custom", message: "Valor inválido." });
      return z.NEVER;
    }
    return Math.round(n * 100) / 100;
  })
  .pipe(z.number().min(0, "O valor não pode ser negativo.").max(999999, "Valor muito alto."));

export const positiveMoneySchema = moneySchema.pipe(
  z.number().positive("Informe um valor maior que zero."),
);

export const optionalMoneySchema = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v, ctx) => {
    if (v === null || v === undefined || v === "") return null;
    const n = parseMoney(v);
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: "Valor inválido." });
      return z.NEVER;
    }
    return Math.round(n * 100) / 100;
  });

export const stockQuantitySchema = z.coerce
  .number({ message: "Informe um número." })
  .int("Use números inteiros.")
  .min(0, "O estoque não pode ser negativo.")
  .max(100000, "Quantidade muito alta.");

export const quantitySchema = z.coerce
  .number({ message: "Informe a quantidade." })
  .int("Use números inteiros.")
  .min(1, "A quantidade mínima é 1.")
  .max(999, "Quantidade muito alta.");

export const barcodeSchema = z.string().transform((v, ctx) => {
  const check = checkBarcode(v);
  if (!check.valid) {
    ctx.addIssue({ code: "custom", message: check.message });
    return z.NEVER;
  }
  return check.value;
});

export const optionalBarcodeSchema = z
  .string()
  .nullish()
  .transform((v, ctx) => {
    if (!v || !v.trim()) return null;
    const check = checkBarcode(v);
    if (!check.valid) {
      ctx.addIssue({ code: "custom", message: check.message });
      return z.NEVER;
    }
    return check.value;
  });

export const skuSchema = z
  .string()
  .trim()
  .min(2, "SKU muito curto.")
  .max(40, "SKU muito longo.")
  .regex(/^[A-Za-z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou sublinhado.")
  .transform((v) => v.toUpperCase());

export const optionalText = (max = 120) =>
  z
    .string()
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim().slice(0, max) : null));

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().min(10, "Telefone com DDD, ex.: (81) 99999-9999.").max(13, "Telefone inválido."));

export const optionalPhoneSchema = z
  .string()
  .nullish()
  .transform((v) => (v ? v.replace(/\D/g, "") : ""))
  .pipe(
    z.union([
      z.literal("").transform(() => null),
      z.string().min(10, "Telefone com DDD, ex.: (81) 99999-9999.").max(13, "Telefone inválido."),
    ]),
  );

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("E-mail inválido."));

export const optionalEmailSchema = z
  .string()
  .nullish()
  .transform((v) => (v ? v.trim().toLowerCase() : ""))
  .pipe(z.union([z.literal("").transform(() => null), z.email("E-mail inválido.")]));

function cpfValid(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export const optionalCpfSchema = z
  .string()
  .nullish()
  .transform((v, ctx) => {
    const digits = (v ?? "").replace(/\D/g, "");
    if (!digits) return null;
    if (!cpfValid(digits)) {
      ctx.addIssue({ code: "custom", message: "CPF inválido." });
      return z.NEVER;
    }
    return digits;
  });

// Converte erros do Zod em { campo: mensagem } para os formulários.
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
