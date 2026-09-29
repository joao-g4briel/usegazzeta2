import Link from "next/link";
import { ProductImage } from "@/components/shared/product-image";
import { swatchFor, type VariantKind } from "@/lib/constants";

export type LowStockItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantKind: VariantKind;
  label: string;
  sku: string;
  stock: number;
  minimumStock: number;
  image: string | null;
};

// Alerta por variante: "Vestido Frente Única · Rosa • P · 2 unidades".
export function LowStockList({ items }: { items: LowStockItem[] }) {
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-stone-ink">Nenhuma variante abaixo do mínimo. Tudo em dia.</p>;
  }
  return (
    <ul className="divide-y divide-hairline">
      {items.map((i) => (
        <li key={i.variantId}>
          <Link
            href={`/admin/estoque/entrada?variante=${i.variantId}`}
            className="flex items-center gap-3 py-3 hover:bg-offwhite"
          >
            <ProductImage
              src={i.image}
              alt={i.productName}
              kind={i.variantKind}
              tint={swatchFor(i.label.split(" • ")[0])}
              monogram={false}
              sizes="44px"
              className="size-11 shrink-0 rounded-xl"
              artClassName="h-[80%]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{i.productName}</p>
              <p className="truncate text-xs text-stone-ink">
                {i.label} · SKU {i.sku}
              </p>
            </div>
            <span
              className={
                i.stock <= 0
                  ? "rounded-full bg-rose-mist px-2.5 py-1 text-xs font-bold text-rose-deep tabular"
                  : "rounded-full bg-gold-mist px-2.5 py-1 text-xs font-bold text-gold-ink tabular"
              }
            >
              {i.stock <= 0 ? "Esgotado" : `${i.stock} ${i.stock === 1 ? "unidade" : "unidades"}`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
