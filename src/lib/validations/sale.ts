import { z } from "zod";
import { idSchema, optionalMoneySchema, optionalText, quantitySchema } from "@/lib/validations/common";

export const cartItemSchema = z.object({
  variantId: idSchema,
  quantity: quantitySchema,
});

export const PAYMENT_METHOD_VALUES = ["PIX", "DINHEIRO", "CREDITO", "DEBITO", "OUTROS"] as const;

export const salePaymentSchema = z.object({
  method: z.enum(PAYMENT_METHOD_VALUES, { message: "Escolha a forma de pagamento." }),
  // Quando omitido, o servidor usa o restante do total.
  amount: optionalMoneySchema,
  receivedAmount: optionalMoneySchema,
  installments: z.coerce.number().int().min(1).max(12).optional().nullable(),
});

export const manualDiscountSchema = z.object({
  type: z.enum(["amount", "percent"]),
  value: z.coerce.number().min(0, "Desconto inválido."),
});

export const finalizeSaleSchema = z.object({
  items: z.array(cartItemSchema).min(1, "O carrinho está vazio.").max(200),
  discount: manualDiscountSchema.nullable().optional(),
  discountReason: optionalText(200),
  couponCode: optionalText(40),
  customerId: z.string().optional().nullable(),
  payments: z.array(salePaymentSchema).min(1, "Escolha a forma de pagamento.").max(5),
});

export type FinalizeSaleInput = z.infer<typeof finalizeSaleSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
