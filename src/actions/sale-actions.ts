"use server";

import { z } from "zod";
import { runAction, revalidateAll } from "@/lib/action";
import { requireActionUser } from "@/lib/session";
import { finalizeSaleSchema } from "@/lib/validations/sale";
import { customerInputSchema } from "@/lib/validations/admin";
import { cancelSale, finalizeSale } from "@/services/sale-service";
import { evaluateCoupon } from "@/services/coupon-service";
import { createCustomer, searchCustomers } from "@/services/customer-service";
import { priceLines, sumCents } from "@/services/pricing-service";
import { prisma } from "@/lib/prisma";
import { searchPosVariants } from "@/services/product-service";

export async function finalizeSaleAction(values: z.input<typeof finalizeSaleSchema>) {
  return runAction(async () => {
    const user = await requireActionUser("pdv");
    const input = finalizeSaleSchema.parse(values);
    const receipt = await finalizeSale(user.storeId, user.id, input);
    revalidateAll();
    return receipt;
  }, "Venda realizada com sucesso");
}

export async function cancelSaleAction(saleId: string, reason?: string | null) {
  return runAction(async () => {
    const user = await requireActionUser("orders");
    const result = await cancelSale(user.storeId, user.id, saleId, reason?.trim() || null);
    revalidateAll();
    return result;
  }, "Venda cancelada e estoque devolvido");
}

// Cupom no PDV: o valor é recalculado no servidor com os preços atuais.
export async function validatePosCouponAction(code: string, items: { variantId: string; quantity: number }[]) {
  return runAction(async () => {
    const user = await requireActionUser("pdv");
    const lines = await priceLines(prisma, user.storeId, items, { checkStock: false });
    const evaluation = await evaluateCoupon(prisma, user.storeId, code, sumCents(lines));
    return {
      code: evaluation.code,
      description: evaluation.description,
      discount: evaluation.discountCents / 100,
    };
  });
}

export async function searchCustomersAction(q: string) {
  return runAction(async () => {
    const user = await requireActionUser("pdv");
    return searchCustomers(user.storeId, q);
  });
}

export async function quickCreateCustomerAction(values: z.input<typeof customerInputSchema>) {
  return runAction(async () => {
    const user = await requireActionUser("customers");
    const input = customerInputSchema.parse(values);
    const customer = await createCustomer(user.storeId, input);
    revalidateAll();
    return customer;
  }, "Cliente cadastrada");
}

// Catálogo completo de variantes ativas para vender sem código de barras.
export async function posCatalogAction() {
  return runAction(async () => {
    const user = await requireActionUser("pdv");
    return searchPosVariants(user.storeId, "", 400);
  });
}
