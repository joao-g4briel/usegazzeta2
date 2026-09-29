import { cache } from "react";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/errors";
import { STORE_SLUG } from "@/lib/constants";
import { toNumber, toNumberOrNull } from "@/lib/money";
import type { StoreSettingsInput } from "@/lib/validations/admin";
import type { z } from "zod";
import type { newUserSchema } from "@/lib/validations/admin";

export type StoreInfo = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  address: string | null;
  shippingFlatRate: number;
  freeShippingThreshold: number | null;
  maxInstallments: number;
  minInstallmentValue: number;
};

function toStoreInfo(s: NonNullable<Awaited<ReturnType<typeof prisma.store.findUnique>>>): StoreInfo {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    logoUrl: s.logoUrl,
    heroImageUrl: s.heroImageUrl,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    instagram: s.instagram,
    address: s.address,
    shippingFlatRate: toNumber(s.shippingFlatRate),
    freeShippingThreshold: toNumberOrNull(s.freeShippingThreshold),
    maxInstallments: s.maxInstallments,
    minInstallmentValue: toNumber(s.minInstallmentValue),
  };
}

// Loja pública: identificada pelo slug configurado (arquitetura pronta para várias lojas).
export const getPublicStore = cache(async (): Promise<StoreInfo> => {
  const store = await prisma.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) {
    throw new DomainError(
      `Loja "${STORE_SLUG}" não encontrada. Rode "npm run db:seed" para criar os dados iniciais.`,
    );
  }
  return toStoreInfo(store);
});

export const getStoreById = cache(async (id: string): Promise<StoreInfo> => {
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) throw new DomainError("Loja não encontrada.", "NOT_FOUND");
  return toStoreInfo(store);
});

export async function updateStoreSettings(storeId: string, input: StoreSettingsInput) {
  return prisma.store.update({
    where: { id: storeId },
    data: {
      name: input.name,
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email,
      instagram: input.instagram,
      address: input.address,
      heroImageUrl: input.heroImageUrl,
      shippingFlatRate: input.shippingFlatRate.toFixed(2),
      freeShippingThreshold:
        input.freeShippingThreshold === null ? null : input.freeShippingThreshold.toFixed(2),
      maxInstallments: input.maxInstallments,
      minInstallmentValue: input.minInstallmentValue.toFixed(2),
    },
  });
}

export async function listUsers(storeId: string) {
  return prisma.user.findMany({
    where: { storeId },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createUser(storeId: string, input: z.infer<typeof newUserSchema>) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new DomainError("Já existe um usuário com este e-mail.", "DUPLICATE", "email");
  return prisma.user.create({
    data: {
      storeId,
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await bcrypt.hash(input.password, 10),
    },
    select: { id: true },
  });
}
