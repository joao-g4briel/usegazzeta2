import { prisma, type TransactionClient } from "@/lib/prisma";
import { DomainError } from "@/lib/errors";
import { formatCents, toCents, toNumber, toNumberOrNull } from "@/lib/money";
import type { CouponInput } from "@/lib/validations/admin";

type Db = TransactionClient | typeof prisma;

export type CouponEvaluation = {
  couponId: string;
  code: string;
  discountCents: number;
  description: string;
};

/** Valida o cupom no servidor e calcula o desconto sobre o subtotal. */
export async function evaluateCoupon(
  db: Db,
  storeId: string,
  rawCode: string,
  subtotalCents: number,
  now = new Date(),
): Promise<CouponEvaluation> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await db.coupon.findUnique({ where: { storeId_code: { storeId, code } } });
  if (!coupon || !coupon.active) throw new DomainError("Cupom inválido ou inativo.", "COUPON_INVALID", "couponCode");
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new DomainError("Este cupom ainda não está valendo.", "COUPON_NOT_STARTED", "couponCode");
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    throw new DomainError("Este cupom expirou.", "COUPON_EXPIRED", "couponCode");
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new DomainError("Este cupom atingiu o limite de usos.", "COUPON_EXHAUSTED", "couponCode");
  }
  const minimum = toCents(coupon.minimumAmount);
  if (minimum > 0 && subtotalCents < minimum) {
    throw new DomainError(
      `Cupom válido para compras a partir de ${formatCents(minimum)}.`,
      "COUPON_MINIMUM",
      "couponCode",
    );
  }
  const raw =
    coupon.type === "PERCENTUAL"
      ? Math.round((subtotalCents * toNumber(coupon.value)) / 100)
      : toCents(coupon.value);
  const discountCents = Math.min(raw, subtotalCents);
  return {
    couponId: coupon.id,
    code: coupon.code,
    discountCents,
    description:
      coupon.type === "PERCENTUAL"
        ? `${toNumber(coupon.value)}% de desconto`
        : `${formatCents(toCents(coupon.value))} de desconto`,
  };
}

/** Registra o uso dentro da transação, respeitando o limite mesmo com concorrência. */
export async function consumeCoupon(
  tx: TransactionClient,
  evaluation: CouponEvaluation,
  ref: { orderId?: string; saleId?: string; customerId?: string | null },
) {
  const updated = await tx.coupon.updateMany({
    where: {
      id: evaluation.couponId,
      OR: [{ maxUses: null }, { usedCount: { lt: tx.coupon.fields.maxUses } }],
    },
    data: { usedCount: { increment: 1 } },
  });
  if (updated.count === 0) {
    throw new DomainError("Este cupom atingiu o limite de usos.", "COUPON_EXHAUSTED", "couponCode");
  }
  await tx.couponUsage.create({
    data: {
      couponId: evaluation.couponId,
      orderId: ref.orderId ?? null,
      saleId: ref.saleId ?? null,
      customerId: ref.customerId ?? null,
      discount: (evaluation.discountCents / 100).toFixed(2),
    },
  });
}

export async function releaseCoupon(tx: TransactionClient, couponId: string) {
  await tx.coupon.updateMany({
    where: { id: couponId, usedCount: { gt: 0 } },
    data: { usedCount: { decrement: 1 } },
  });
}

export async function listCoupons(storeId: string) {
  const rows = await prisma.coupon.findMany({
    where: { storeId },
    include: { _count: { select: { usages: true } } },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    type: c.type,
    value: toNumber(c.value),
    minimumAmount: toNumberOrNull(c.minimumAmount),
    startsAt: c.startsAt?.toISOString() ?? null,
    endsAt: c.endsAt?.toISOString() ?? null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    active: c.active,
  }));
}

export type CouponRow = Awaited<ReturnType<typeof listCoupons>>[number];

function couponData(input: CouponInput) {
  return {
    code: input.code,
    description: input.description,
    type: input.type,
    value: input.value.toFixed(2),
    minimumAmount: input.minimumAmount === null ? null : input.minimumAmount.toFixed(2),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    maxUses: input.maxUses,
    active: input.active,
  };
}

export async function saveCoupon(storeId: string, input: CouponInput, id?: string) {
  const clash = await prisma.coupon.findFirst({
    where: { storeId, code: input.code, ...(id ? { id: { not: id } } : {}) },
  });
  if (clash) throw new DomainError("Já existe um cupom com este código.", "DUPLICATE", "code");
  if (id) {
    const existing = await prisma.coupon.findFirst({ where: { id, storeId } });
    if (!existing) throw new DomainError("Cupom não encontrado.", "NOT_FOUND");
    return prisma.coupon.update({ where: { id }, data: couponData(input) });
  }
  return prisma.coupon.create({ data: { storeId, ...couponData(input) } });
}

export async function toggleCoupon(storeId: string, id: string, active: boolean) {
  const existing = await prisma.coupon.findFirst({ where: { id, storeId } });
  if (!existing) throw new DomainError("Cupom não encontrado.", "NOT_FOUND");
  return prisma.coupon.update({ where: { id }, data: { active } });
}
