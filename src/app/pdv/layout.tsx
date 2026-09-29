import type { Metadata, Viewport } from "next";
import { PosProvider } from "@/components/pdv/pos-provider";
import { PosHeader } from "@/components/pdv/pos-header";
import { ServiceWorker } from "@/components/shared/service-worker";
import { requirePageUser } from "@/lib/session";
import { listCategories } from "@/services/product-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "PDV", template: "%s · PDV Use Gazzeta" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#5F735B",
};

export default async function PdvLayout({ children }: LayoutProps<"/pdv">) {
  const user = await requirePageUser();
  const categories = await listCategories(user.storeId, true);
  return (
    <PosProvider categories={categories} role={user.role}>
      <div className="flex min-h-dvh flex-col bg-offwhite">
        <PosHeader />
        {children}
      </div>
      <ServiceWorker />
    </PosProvider>
  );
}
