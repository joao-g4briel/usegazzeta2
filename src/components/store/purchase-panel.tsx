"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL, installmentsFor } from "@/lib/money";
import { dimsOf, findVariant, initialSelection, DIM_LABELS, type Dim, type Selection } from "@/lib/variant-selection";
import { VariantOptions } from "@/components/store/variant-options";
import { StoreStockNote } from "@/components/shared/stock-badge";
import { useAddToCart } from "@/components/store/product-card-actions";
import { useCart } from "@/components/store/cart-provider";
import type { StoreProductDetail } from "@/types/catalog";

export function PurchasePanel({
  product,
  maxInstallments,
  minInstallmentValue,
}: {
  product: StoreProductDetail;
  maxInstallments: number;
  minInstallmentValue: number;
}) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const { add } = useCart();
  const dims = useMemo(() => dimsOf(product.variants), [product.variants]);
  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(product.variants, product.variantKind === "APPAREL"),
  );
  const [quantity, setQuantity] = useState(1);

  // Cor + tamanho escolhidos → a variante exata (product_id + variant_id).
  const variant = findVariant(product.variants, selection, dims);
  const price = variant?.price ?? product.price;
  const compareAt = variant
    ? variant.promotionalPrice !== null && variant.promotionalPrice < variant.salePrice
      ? variant.salePrice
      : null
    : product.compareAtPrice;
  const installments = installmentsFor(price, maxInstallments, minInstallmentValue);
  const missing = dims.filter((d) => !selection[d]);
  const maxQty = Math.max(1, Math.min(variant?.stock ?? 1, 10));

  function select(dim: Dim, value: string) {
    setSelection((s) => {
      const next = { ...s, [dim]: value };
      // Ao trocar a cor, limpa o tamanho se a combinação não existir.
      for (const d of dims) {
        if (d === dim || !next[d]) continue;
        const exists = product.variants.some(
          (v) => v[dim] === value && v[d] === next[d],
        );
        if (!exists) delete next[d];
      }
      return next;
    });
    setQuantity(1);
  }

  const canBuy = Boolean(variant && variant.stock > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {compareAt ? (
            <span className="text-lg text-stone-ink line-through tabular">{formatBRL(compareAt)}</span>
          ) : null}
          <span className="text-[2rem] leading-none font-bold text-ink tabular">
            {!variant && product.variants.length > 1 && new Set(product.variants.map((v) => v.price)).size > 1 ? (
              <span className="mr-1.5 text-sm font-medium text-stone-ink">a partir de</span>
            ) : null}
            {formatBRL(price)}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-stone-ink tabular">
          {installments
            ? `em até ${installments.count}x de ${formatBRL(installments.value)} no cartão`
            : "à vista no Pix ou no cartão"}
        </p>
      </div>

      {dims.length ? (
        <VariantOptions variants={product.variants} dims={dims} selection={selection} onSelect={select} />
      ) : null}

      <div className="flex min-h-6 items-center">
        {variant ? (
          <StoreStockNote stock={variant.stock} />
        ) : product.available ? (
          <span className="text-sm text-stone-ink">
            Escolha {missing.map((d) => (d === "color" ? "a cor" : `o ${DIM_LABELS[d].toLowerCase()}`)).join(" e ")} para ver a
            disponibilidade.
          </span>
        ) : (
          <StoreStockNote stock={0} />
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex h-12 items-center justify-between rounded-2xl border border-[#d9d0c1] bg-paper sm:w-36">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="inline-flex size-12 items-center justify-center text-ink disabled:text-stone/50"
          >
            <Minus className="size-4" />
          </button>
          <span className="text-base font-semibold tabular" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={!canBuy || quantity >= maxQty}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            className="inline-flex size-12 items-center justify-center text-ink disabled:text-stone/50"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button
          size="lg"
          variant="outline"
          className="w-full border-olive text-olive hover:bg-sage-mist sm:w-auto sm:flex-1"
          disabled={!canBuy}
          onClick={() => variant && addToCart(variant.id, `${product.name} · ${variant.label}`, quantity)}
        >
          <ShoppingBag strokeWidth={1.8} /> Adicionar à sacola
        </Button>
      </div>
      <Button
        size="lg"
        className="h-14 text-[0.95rem] tracking-[0.08em] uppercase"
        disabled={!canBuy}
        onClick={() => {
          if (!variant) return;
          add(variant.id, quantity);
          router.push("/checkout");
        }}
      >
        {canBuy ? "Comprar agora" : variant ? "Esgotado" : "Escolha as opções"}
      </Button>
    </div>
  );
}
