import { Suspense } from "react";
import { CartProvider } from "@/components/store/cart-provider";
import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { getPublicStore } from "@/services/store-service";

// Preço e disponibilidade nunca ficam em cache: a loja lê o mesmo estoque do PDV.
export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const store = await getPublicStore();
  return (
    <CartProvider>
      <Suspense fallback={<div className="h-[7.5rem] bg-sage lg:h-[7.5rem]" />}>
        <StoreHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <StoreFooter store={store} />
    </CartProvider>
  );
}
