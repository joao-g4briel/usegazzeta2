import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { StockEntryForm } from "@/components/admin/stock-forms";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = { title: "Entrada de estoque" };

export default async function StockEntryPage({ searchParams }: PageProps<"/admin/estoque/entrada">) {
  await requirePageUser("inventory");
  const sp = await searchParams;
  const variante = typeof sp.variante === "string" ? sp.variante : null;
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        back={{ href: "/admin/estoque", label: "Estoque" }}
        title="Entrada de estoque"
        description="Escaneie ou busque a variante e informe a quantidade recebida."
      />
      <StockEntryForm initialVariantId={variante} />
    </div>
  );
}
