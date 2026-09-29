import { z } from "zod";
import {
  emailSchema,
  idSchema,
  optionalCpfSchema,
  optionalPhoneSchema,
  optionalText,
  phoneSchema,
} from "@/lib/validations/common";
import { cartItemSchema } from "@/lib/validations/sale";

export const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const addressSchema = z.object({
  zipCode: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().length(8, "CEP deve ter 8 números.")),
  street: z.string().trim().min(3, "Informe a rua.").max(160),
  number: z.string().trim().min(1, "Informe o número.").max(20),
  complement: optionalText(80),
  district: optionalText(80),
  city: z.string().trim().min(2, "Informe a cidade.").max(80),
  state: z.enum(BRAZIL_STATES, { message: "Escolha o estado." }),
});

const checkoutBase = z.object({
  customer: z.object({
    name: z.string().trim().min(3, "Informe seu nome completo.").max(120),
    email: emailSchema,
    phone: phoneSchema,
    whatsapp: optionalPhoneSchema,
    cpf: optionalCpfSchema,
  }),
  shippingMethod: z.enum(["ENTREGA", "RETIRADA"]),
  address: addressSchema.nullable().optional(),
  couponCode: optionalText(40),
  paymentMethod: z.enum(["PIX", "CREDITO"], { message: "Escolha a forma de pagamento." }),
  notes: optionalText(500),
});

function requireAddress(data: { shippingMethod: string; address?: unknown }, ctx: z.RefinementCtx) {
  if (data.shippingMethod === "ENTREGA" && !data.address) {
    ctx.addIssue({ code: "custom", path: ["address"], message: "Informe o endereço de entrega." });
  }
}

// Formulário do checkout (sem itens: a sacola vem do navegador e é revalidada no servidor).
export const checkoutFormSchema = checkoutBase.superRefine(requireAddress);
export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;

export const checkoutSchema = checkoutBase
  .extend({ items: z.array(cartItemSchema).min(1, "Sua sacola está vazia.").max(100) })
  .superRefine(requireAddress);

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutFormValues = z.input<typeof checkoutSchema>;

export const ORDER_STATUS_VALUES = [
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "EM_SEPARACAO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
] as const;

export const updateOrderStatusSchema = z.object({
  orderId: idSchema,
  status: z.enum(ORDER_STATUS_VALUES),
});
