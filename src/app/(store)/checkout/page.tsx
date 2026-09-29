import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <h1 className="mb-8 font-serif text-[2.6rem] leading-none font-medium sm:text-[3.2rem]">Finalizar compra</h1>
      <CheckoutForm />
    </div>
  );
}
