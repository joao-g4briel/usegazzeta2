import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requirePageUser } from "@/lib/session";
import { listCategories } from "@/services/product-service";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  const user = await requirePageUser("products");
  const categories = await listCategories(user.storeId);
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        back={{ href: "/admin/produtos", label: "Produtos" }}
        title="Cadastrar novo produto"
        description="Adicione um produto ao catálogo da Use Gazzeta."
      />
      <ProductForm product={null} categories={categories} />
    </div>
  );
}
