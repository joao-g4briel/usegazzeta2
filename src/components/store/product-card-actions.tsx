"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, ShoppingBag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { dimsOf, findVariant, initialSelection, type Dim, type Selection } from "@/lib/variant-selection";
import { VariantOptions } from "@/components/store/variant-options";
import { useCart } from "@/components/store/cart-provider";
import { useIsClient } from "@/hooks/use-is-client";
import type { StoreProductCard } from "@/types/catalog";

export function FavoriteButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const { isFavorite, toggleFavorite, ready } = useCart();
  const isClient = useIsClient();
  const active = isClient && ready && isFavorite(slug);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remover ${name} dos favoritos` : `Salvar ${name} nos favoritos`}
      onClick={(e) => {
        e.preventDefault();
        const added = toggleFavorite(slug);
        toast(added ? "Salvo nos favoritos" : "Removido dos favoritos");
      }}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full bg-paper/90 text-ink shadow-soft backdrop-blur-sm transition-transform hover:scale-105",
        className,
      )}
    >
      <Heart className={cn("size-[1.1rem]", active && "fill-rose-deep text-rose-deep")} strokeWidth={1.7} />
    </button>
  );
}

export function useAddToCart() {
  const { add } = useCart();
  const router = useRouter();
  return (variantId: string, label: string, quantity = 1) => {
    add(variantId, quantity);
    toast.success("Adicionado à sacola", {
      description: label,
      action: { label: "Ver sacola", onClick: () => router.push("/carrinho") },
    });
  };
}

export function QuickAdd({ product }: { product: StoreProductCard }) {
  const addToCart = useAddToCart();
  const [open, setOpen] = useState(false);
  const dims = dimsOf(product.variants);
  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(product.variants, product.variantKind === "APPAREL"),
  );
  const variant = findVariant(product.variants, selection, dims);

  if (!product.available) {
    return (
      <Button variant="secondary" className="w-full" disabled>
        Esgotado
      </Button>
    );
  }

  if (product.singleVariantId) {
    return (
      <Button
        variant="soft"
        className="w-full"
        onClick={() => addToCart(product.singleVariantId!, product.name)}
      >
        <ShoppingBag strokeWidth={1.8} /> Adicionar à sacola
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="soft" className="w-full">
          <ShoppingBag strokeWidth={1.8} /> Adicionar à sacola
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-72 rounded-2xl border-hairline bg-paper p-4 shadow-lift">
        <p className="mb-3 font-serif text-lg leading-tight font-semibold">{product.name}</p>
        <VariantOptions
          compact
          variants={product.variants}
          dims={dims}
          selection={selection}
          onSelect={(dim: Dim, value: string) => setSelection((s) => ({ ...s, [dim]: value }))}
        />
        <Button
          className="mt-4 w-full"
          disabled={!variant || variant.stock <= 0}
          onClick={() => {
            if (!variant) return;
            addToCart(variant.id, `${product.name} · ${variant.label}`);
            setOpen(false);
          }}
        >
          {variant
            ? variant.stock > 0
              ? `Adicionar · ${formatBRL(variant.price)}`
              : "Esgotado"
            : `Escolha ${dims.filter((d) => !selection[d]).map((d) => (d === "size" ? "o tamanho" : d === "color" ? "a cor" : d === "tone" ? "o tom" : "o volume")).join(" e ")}`}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
