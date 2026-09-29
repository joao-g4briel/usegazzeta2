import type { Metadata } from "next";
import { ScannerWorkspace } from "@/components/pdv/scanner-workspace";
import { requirePageUser } from "@/lib/session";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Scanner" };

export default async function ScannerPage({ searchParams }: PageProps<"/pdv/scanner">) {
  const user = await requirePageUser("scanner");
  const sp = await searchParams;
  const mode = sp.modo === "consulta" || !can(user.role, "pdv") ? "consulta" : "venda";
  return <ScannerWorkspace initialMode={mode} layout="page" />;
}
