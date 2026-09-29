"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/misc";
import { useCart } from "@/components/store/cart-provider";
import { favoriteProductsAction } from "@/actions/store-actions";
import { ProductCard } from "@/components/store/product-card";
import type { StoreProductCard } from "@/types/catalog";

export function FavoritesView() {
  const { favorites, ready } = useCart();
  const [cards, setCards] = useState<StoreProductCard[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    favoriteProductsAction(favorites).then((r) => {
      if (alive) setCards(r.ok ? r.data : []);
    });
    return () => {
      alive = false;
    };
  }, [favorites, ready]);

  if (!cards) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!cards.length) {
    return (
      <EmptyState
        icon={<Heart />}
        title="Nenhum favorito ainda"
        description="Toque no coração das peças que você amar para encontrá-las aqui depois."
        action={
          <Button asChild>
            <Link href="/produtos">Explorar produtos</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {cards.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
