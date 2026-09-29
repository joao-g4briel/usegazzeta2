import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requirePageUser } from "@/lib/session";
import { getProductForEdit, listCategories } from "@/services/product-service";

export const metadata: Metadata = { title: "Editar produto" };

export default async function EditProductPage({ params }: PageProps<"/admin/produtos/[id]">) {
  const user = await requirePageUser("products");
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductForEdit(user.storeId, id), listCategories(user.storeId)]);
  if (!product) notFound();
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        back={{ href: "/admin/produtos", label: "Produtos" }}
        title={product.name}
        description="Edite as informações, variações, fotos e SEO do produto."
        actions={
          <Button asChild variant="outline">
            <Link href={`/produtos/${product.slug}`} target="_blank">
              <ExternalLink /> Ver na loja
            </Link>
          </Button>
        }
      />
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
