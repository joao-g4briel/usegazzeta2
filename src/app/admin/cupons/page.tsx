import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { CouponManager } from "@/components/admin/coupon-manager";
import { requirePageUser } from "@/lib/session";
import { listCoupons } from "@/services/coupon-service";

export const metadata: Metadata = { title: "Cupons" };

export default async function CouponsPage() {
  const user = await requirePageUser("coupons");
  const coupons = await listCoupons(user.storeId);
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Cupons e promoções" description="Percentual ou valor fixo, com mínimo, validade e limite de usos." />
      <CouponManager coupons={coupons} />
    </div>
  );
}
