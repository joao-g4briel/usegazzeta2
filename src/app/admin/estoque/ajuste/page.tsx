import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { StockAdjustForm } from "@/components/admin/stock-forms";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = { title: "Ajuste de estoque" };

export default async function StockAdjustPage({ searchParams }: PageProps<"/admin/estoque/ajuste">) {
  await requirePageUser("inventory");
  const sp = await searchParams;
  const variante = typeof sp.variante === "string" ? sp.variante : null;
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        back={{ href: "/admin/estoque", label: "Estoque" }}
        title="Ajuste de estoque"
        description="Correção, perda, avaria, inventário ou devolução — sempre com motivo registrado."
      />
      <StockAdjustForm initialVariantId={variante} />
    </div>
  );
}
