import { z } from "zod";
import { idSchema, optionalMoneySchema, optionalText, quantitySchema } from "@/lib/validations/common";

export const stockEntrySchema = z.object({
  variantId: idSchema,
  quantity: quantitySchema,
  unitCost: optionalMoneySchema,
  supplier: optionalText(120),
  note: optionalText(300),
});

export type StockEntryInput = z.infer<typeof stockEntrySchema>;

export const ADJUSTMENT_REASON_VALUES = [
  "CORRECAO",
  "PERDA",
  "AVARIA",
  "INVENTARIO",
  "DEVOLUCAO",
] as const;

export const stockAdjustmentSchema = z
  .object({
    variantId: idSchema,
    mode: z.enum(["add", "remove", "set"]),
    quantity: z.coerce.number().int("Use números inteiros.").min(0, "Quantidade inválida.").max(100000),
    reason: z.enum(ADJUSTMENT_REASON_VALUES, { message: "Escolha o motivo do ajuste." }),
    note: optionalText(300),
  })
  .superRefine((data, ctx) => {
    if (data.mode !== "set" && data.quantity < 1) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: "Informe ao menos 1 unidade." });
    }
  });

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
