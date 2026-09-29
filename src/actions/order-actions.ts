"use server";

import { z } from "zod";
import { runAction, revalidateAll } from "@/lib/action";
import { requireActionUser } from "@/lib/session";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { updateOrderStatusSchema } from "@/lib/validations/order";
import { updateOrderStatus } from "@/services/order-service";

export async function updateOrderStatusAction(values: z.input<typeof updateOrderStatusSchema>) {
  return runAction(async () => {
    const user = await requireActionUser("orders");
    const input = updateOrderStatusSchema.parse(values);
    const result = await updateOrderStatus(user.storeId, user.id, input.orderId, input.status);
    revalidateAll();
    return result;
  }).then((r) =>
    r.ok
      ? {
          ...r,
          message:
            r.data.status === "CANCELADO"
              ? `Pedido #${r.data.number} cancelado — peças devolvidas ao estoque`
              : `Pedido #${r.data.number}: ${ORDER_STATUS_LABELS[r.data.status]}`,
        }
      : r,
  );
}
