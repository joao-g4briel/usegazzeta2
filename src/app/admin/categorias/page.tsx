import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryManager } from "@/components/admin/category-manager";
import { requirePageUser } from "@/lib/session";
import { listCategories } from "@/services/product-service";

export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  const user = await requirePageUser("categories");
  const categories = await listCategories(user.storeId);
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Categorias" description="Organize a vitrine e defina como cada categoria varia: cor e tamanho, tom, volume…" />
      <CategoryManager categories={categories} />
    </div>
  );
}
