import Link from "next/link";
import { cn } from "@/lib/utils";
import { BADGE_LABELS, swatchFor } from "@/lib/constants";
import { formatBRL } from "@/lib/money";
import { ProductImage } from "@/components/shared/product-image";
import { FavoriteButton, QuickAdd } from "@/components/store/product-card-actions";
import type { StoreProductCard } from "@/types/catalog";

export function ProductBadge({ badge, className }: { badge: StoreProductCard["badge"]; className?: string }) {
  if (!badge) return null;
  const tone =
    badge === "NOVIDADE"
      ? "bg-olive text-offwhite"
      : badge === "OFERTA"
        ? "bg-rose text-ink"
        : badge === "ULTIMAS_PECAS"
          ? "bg-ink text-offwhite"
          : badge === "FAVORITO"
            ? "bg-gold-mist text-gold-ink"
            : "bg-paper/95 text-ink";
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-[0.72rem] font-semibold tracking-[0.02em] shadow-[0_1px_2px_rgb(23_26_24/0.06)]",
        tone,
        className,
      )}
    >
      {BADGE_LABELS[badge]}
    </span>
  );
}

export function ProductCard({
  product,
  priority,
  className,
}: {
  product: StoreProductCard;
  priority?: boolean;
  className?: string;
}) {
  const tint = product.swatches[0] ? swatchFor(product.swatches[0].color, product.swatches[0].hex) : null;
  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="relative">
        <Link href={`/produtos/${product.slug}`} className="block" aria-label={product.name}>
          <ProductImage
            src={product.image}
            alt={product.imageAlt ?? product.name}
            kind={product.variantKind}
            tint={tint}
            priority={priority}
            className={cn(
              "aspect-[4/5] rounded-2xl transition-[transform,box-shadow] duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-lift",
              !product.available && "opacity-70 saturate-50",
            )}
          />
        </Link>
        <ProductBadge
          badge={product.available ? product.badge : null}
          className="absolute top-3 left-3"
        />
        {!product.available ? (
          <span className="absolute top-3 left-3 inline-flex h-7 items-center rounded-full bg-paper px-3 text-[0.72rem] font-semibold text-stone-ink">
            Esgotado
          </span>
        ) : null}
        <FavoriteButton slug={product.slug} name={product.name} className="absolute top-3 right-3" />
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3.5">
        <h3 className="text-[0.98rem] leading-snug font-medium text-ink">
          <Link href={`/produtos/${product.slug}`} className="hover:text-olive">
            {product.name}
          </Link>
        </h3>
        <p className="-mt-0.5 text-[0.8rem] text-stone-ink">{product.categoryName}</p>
        {product.swatches.length > 1 ? (
          <div className="flex items-center gap-1.5 pt-0.5" aria-label={`Cores: ${product.swatches.map((s) => s.color).join(", ")}`}>
            {product.swatches.slice(0, 5).map((s) => (
              <span
                key={s.color}
                title={s.color}
                className="size-3 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: swatchFor(s.color, s.hex) ?? "#ddd" }}
              />
            ))}
          </div>
        ) : null}
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          {product.compareAtPrice ? (
            <span className="text-sm text-stone-ink line-through tabular">{formatBRL(product.compareAtPrice)}</span>
          ) : null}
          <span className="text-lg font-bold text-ink tabular">
            {product.variants.length > 1 && new Set(product.variants.map((v) => v.price)).size > 1 ? (
              <span className="mr-1 text-xs font-medium text-stone-ink">a partir de</span>
            ) : null}
            {formatBRL(product.price)}
          </span>
        </div>
        {product.installments ? (
          <p className="text-[0.8rem] text-stone-ink tabular">
            em até {product.installments.count}x de {formatBRL(product.installments.value)}
          </p>
        ) : (
          <p className="text-[0.8rem] text-stone-ink">à vista no Pix ou cartão</p>
        )}
        <div className="mt-auto pt-3">
          <QuickAdd product={product} />
        </div>
      </div>
    </article>
  );
}
