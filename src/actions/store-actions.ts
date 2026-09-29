"use server";

import { z } from "zod";
import { runAction, revalidateAll } from "@/lib/action";
import { cartItemSchema } from "@/lib/validations/sale";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validations/order";
import { getPublicStore } from "@/services/store-service";
import { lookupOrder, placeOrder, quoteCart } from "@/services/order-service";
import { listStoreProducts } from "@/services/product-service";

// Ações públicas da loja: nenhuma confia em preço ou estoque vindos do navegador.

const quoteSchema = z.object({
  items: z.array(cartItemSchema).max(100),
  couponCode: z.string().max(40).nullable().optional(),
  shippingMethod: z.enum(["ENTREGA", "RETIRADA"]).optional(),
});

export async function quoteCartAction(values: z.input<typeof quoteSchema>) {
  return runAction(async () => {
    const input = quoteSchema.parse(values);
    const store = await getPublicStore();
    return quoteCart(store, input.items, {
      couponCode: input.couponCode,
      shippingMethod: input.shippingMethod,
    });
  });
}

export async function placeOrderAction(values: CheckoutFormValues) {
  return runAction(async () => {
    const input = checkoutSchema.parse(values);
    const store = await getPublicStore();
    const order = await placeOrder(store, input);
    revalidateAll();
    return order;
  }, "Pedido recebido!");
}

const lookupSchema = z.object({
  email: z.email("Informe o e-mail usado no pedido."),
  number: z.coerce.number().int().positive("Informe o número do pedido."),
});

export async function lookupOrderAction(values: z.input<typeof lookupSchema>) {
  return runAction(async () => {
    const input = lookupSchema.parse(values);
    const store = await getPublicStore();
    const id = await lookupOrder(store.id, input.email, input.number);
    if (!id) return { id: null };
    return { id };
  });
}

export async function favoriteProductsAction(slugs: string[]) {
  return runAction(async () => {
    const store = await getPublicStore();
    const safe = slugs.filter((s) => /^[a-z0-9-]{1,90}$/.test(s)).slice(0, 60);
    if (!safe.length) return [];
    const cards = await listStoreProducts({ storeId: store.id, settings: store });
    return cards.filter((c) => safe.includes(c.slug));
  });
}
