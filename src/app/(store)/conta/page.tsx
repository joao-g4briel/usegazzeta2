import type { Metadata } from "next";
import { OrderLookup } from "@/components/store/order-lookup";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="mx-auto grid max-w-[1100px] gap-12 px-4 pt-12 pb-24 sm:px-6 md:grid-cols-2 md:items-center">
      <div>
        <h1 className="font-serif text-[2.6rem] leading-[1.02] font-medium sm:text-[3.3rem]">
          Acompanhe seu
          <span className="block font-script text-[1.3em] leading-[0.95] font-normal text-gold-ink">pedido</span>
        </h1>
        <p className="mt-5 max-w-sm text-stone-ink">
          Informe o e-mail da compra e o número do pedido para ver o andamento, os itens e o endereço de entrega.
        </p>
      </div>
      <div className="rounded-3xl bg-cream p-6 sm:p-8">
        <OrderLookup />
      </div>
    </div>
  );
}
