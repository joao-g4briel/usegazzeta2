import type { Metadata } from "next";
import { PosScreen } from "@/components/pdv/pos-screen";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = { title: "Venda presencial" };

export default async function PdvPage() {
  await requirePageUser("pdv");
  return <PosScreen />;
}
