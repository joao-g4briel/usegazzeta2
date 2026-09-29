"use server";

import { z } from "zod";
import { runAction, revalidateAll } from "@/lib/action";
import { requireActionUser } from "@/lib/session";
import {
  couponInputSchema,
  customerInputSchema,
  newUserSchema,
  storeSettingsSchema,
  type CouponFormValues,
} from "@/lib/validations/admin";
import { saveCoupon, toggleCoupon } from "@/services/coupon-service";
import { createCustomer, updateCustomer } from "@/services/customer-service";
import { createUser, updateStoreSettings } from "@/services/store-service";

export async function saveCustomerAction(values: z.input<typeof customerInputSchema>, id?: string) {
  return runAction(async () => {
    const user = await requireActionUser("customers");
    const input = customerInputSchema.parse(values);
    const customer = id
      ? await updateCustomer(user.storeId, id, input)
      : await createCustomer(user.storeId, input);
    revalidateAll();
    return { id: customer.id };
  }, id ? "Cliente atualizada" : "Cliente cadastrada");
}

export async function saveCouponAction(values: CouponFormValues, id?: string) {
  return runAction(async () => {
    const user = await requireActionUser("coupons");
    const input = couponInputSchema.parse(values);
    const coupon = await saveCoupon(user.storeId, input, id);
    revalidateAll();
    return { id: coupon.id };
  }, id ? "Cupom atualizado" : "Cupom criado");
}

export async function toggleCouponAction(id: string, active: boolean) {
  return runAction(async () => {
    const user = await requireActionUser("coupons");
    await toggleCoupon(user.storeId, id, active);
    revalidateAll();
    return { active };
  }, active ? "Cupom ativado" : "Cupom pausado");
}

export async function saveStoreSettingsAction(values: z.input<typeof storeSettingsSchema>) {
  return runAction(async () => {
    const user = await requireActionUser("settings");
    const input = storeSettingsSchema.parse(values);
    await updateStoreSettings(user.storeId, input);
    revalidateAll();
    return null;
  }, "Configurações salvas");
}

export async function createUserAction(values: z.input<typeof newUserSchema>) {
  return runAction(async () => {
    const user = await requireActionUser("settings");
    const input = newUserSchema.parse(values);
    const created = await createUser(user.storeId, input);
    revalidateAll();
    return created;
  }, "Usuário criado");
}
