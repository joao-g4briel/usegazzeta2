import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { MarketingList } from "@/components/admin/marketing-list";
import { requirePageUser } from "@/lib/session";
import { listAdminProducts } from "@/services/product-service";

export const metadata: Metadata = { title: "Marketing" };

export default async function MarketingPage() {
  const user = await requirePageUser("marketing");
  const rows = (await listAdminProducts({ storeId: user.storeId, status: "active" })).sort(
    (a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name),
  );
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Marketing"
        description="Escolha as peças em destaque na página inicial e os selos da vitrine."
        actions={
          <Button asChild variant="outline">
            <Link href="/" target="_blank">
              <ExternalLink /> Ver loja
            </Link>
          </Button>
        }
      />
      <MarketingList rows={rows} />
    </div>
  );
}
