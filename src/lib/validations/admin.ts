import { z } from "zod";
import {
  emailSchema,
  moneySchema,
  optionalCpfSchema,
  optionalEmailSchema,
  optionalMoneySchema,
  optionalPhoneSchema,
  optionalText,
} from "@/lib/validations/common";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "A senha tem pelo menos 6 caracteres.").max(200),
});

export const customerInputSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome.").max(120),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    whatsapp: optionalPhoneSchema,
    cpf: optionalCpfSchema,
    notes: optionalText(500),
  })
  .superRefine((data, ctx) => {
    if (!data.phone && !data.whatsapp && !data.email) {
      ctx.addIssue({
        code: "custom",
        path: ["whatsapp"],
        message: "Informe WhatsApp, telefone ou e-mail para contato.",
      });
    }
  });

export type CustomerInput = z.infer<typeof customerInputSchema>;

const optionalDate = z
  .string()
  .nullish()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Data inválida." });
      return z.NEVER;
    }
    return d;
  });

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Código muito curto.")
      .max(30, "Código muito longo.")
      .regex(/^[A-Z0-9_-]+$/, "Use letras, números, hífen ou sublinhado, sem espaços."),
    description: optionalText(160),
    type: z.enum(["PERCENTUAL", "VALOR_FIXO"]),
    value: moneySchema.pipe(z.number().positive("Informe o valor do desconto.")),
    minimumAmount: optionalMoneySchema,
    startsAt: optionalDate,
    endsAt: optionalDate,
    maxUses: z
      .union([z.literal(""), z.coerce.number().int().min(1, "Mínimo de 1 uso.")])
      .nullish()
      .transform((v) => (typeof v === "number" ? v : null)),
    active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERCENTUAL" && data.value > 100) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "O percentual máximo é 100%." });
    }
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "A data final é anterior à inicial." });
    }
  });

export type CouponInput = z.infer<typeof couponInputSchema>;
export type CouponFormValues = z.input<typeof couponInputSchema>;

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: optionalPhoneSchema,
  whatsapp: optionalPhoneSchema,
  email: optionalEmailSchema,
  instagram: optionalText(60),
  address: optionalText(200),
  heroImageUrl: optionalText(1000),
  shippingFlatRate: moneySchema,
  freeShippingThreshold: optionalMoneySchema,
  maxInstallments: z.coerce.number().int().min(1).max(12),
  minInstallmentValue: moneySchema,
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

export const newUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z.string().min(8, "Use pelo menos 8 caracteres.").max(200),
  role: z.enum(["ADMIN", "MANAGER", "SELLER", "STOCK"]),
});
