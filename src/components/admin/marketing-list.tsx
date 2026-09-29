"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BADGE_LABELS, swatchFor, type ProductBadge } from "@/lib/constants";
import { formatBRL } from "@/lib/money";
import { ProductImage } from "@/components/shared/product-image";
import { setProductHighlightAction } from "@/actions/product-actions";
import type { AdminProductRow } from "@/types/catalog";

export function MarketingList({ rows }: { rows: AdminProductRow[] }) {
  const [pending, start] = useTransition();
  const featuredCount = rows.filter((r) => r.featured).length;

  function update(productId: string, data: { featured?: boolean; badge?: ProductBadge | null }) {
    start(async () => {
      const r = await setProductHighlightAction({ productId, ...data });
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-cream px-5 py-4 text-sm text-stone-ink">
        <strong className="text-ink">{featuredCount}</strong> produtos em destaque. A página inicial mostra os seis primeiros em
        “Destaques da Use Gazzeta” e usa uma peça de cada categoria na vitrine do topo.
      </p>
      <ul className={cn("divide-y divide-hairline rounded-2xl border border-hairline bg-paper shadow-soft", pending && "opacity-80")}>
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap">
            <ProductImage src={r.image} alt={r.name} kind={r.category.variantKind} tint={swatchFor(r.variants.find((v) => v.color)?.color)} monogram={false} sizes="48px" className="size-12 shrink-0 rounded-xl" artClassName="h-[80%]" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.name}</p>
              <p className="text-xs text-stone-ink">
                {r.category.name} · {formatBRL(r.priceFrom)} · {r.totalStock} em estoque
              </p>
            </div>
            <select
              aria-label={`Selo de ${r.name}`}
              value={r.badge ?? ""}
              onChange={(e) => update(r.id, { badge: (e.target.value || null) as ProductBadge | null })}
              className="h-9 rounded-xl border border-input bg-paper px-2.5 text-sm"
            >
              <option value="">Selo automático</option>
              {(Object.keys(BADGE_LABELS) as ProductBadge[]).map((b) => (
                <option key={b} value={b}>
                  {BADGE_LABELS[b]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
              <Star className={cn("size-4", r.featured ? "fill-gold text-gold" : "text-stone")} />
              Destaque
              <Switch checked={r.featured} onCheckedChange={(v) => update(r.id, { featured: v })} />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
