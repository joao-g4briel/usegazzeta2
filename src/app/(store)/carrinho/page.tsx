import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = { title: "Sacola", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <h1 className="mb-8 font-serif text-[2.6rem] leading-none font-medium sm:text-[3.2rem]">Sua sacola</h1>
      <CartView />
    </div>
  );
}
