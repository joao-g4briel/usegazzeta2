import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { ServiceWorker } from "@/components/shared/service-worker";
import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel Use Gazzeta" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requirePageUser();
  const [orders, lowStock] = await Promise.all([
    prisma.order.count({ where: { storeId: user.storeId, orderStatus: "AGUARDANDO_PAGAMENTO" } }),
    prisma.productVariant.count({
      where: {
        active: true,
        product: { storeId: user.storeId, active: true },
        stock: { lte: prisma.productVariant.fields.minimumStock },
      },
    }),
  ]);
  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }} counts={{ orders, lowStock }}>
      {children}
      <ServiceWorker />
    </AdminShell>
  );
}
