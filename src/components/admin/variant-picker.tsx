"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, X } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { swatchFor } from "@/lib/constants";
import { ProductImage } from "@/components/shared/product-image";
import { ScanButton } from "@/components/shared/scan-dialog";
import { getVariantAction, lookupBarcodeAction, searchVariantsAction } from "@/actions/inventory-actions";
import type { PosVariant } from "@/types/catalog";

// Escolha de variante por busca ou código de barras (entrada e ajuste de estoque).
export function VariantPicker({
  value,
  onChange,
  initialVariantId,
}: {
  value: PosVariant | null;
  onChange: (v: PosVariant | null) => void;
  initialVariantId?: string | null;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PosVariant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialVariantId) return;
    getVariantAction(initialVariantId).then((r) => {
      if (r.ok && r.data) onChange(r.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carrega a variante vinda da URL uma vez
  }, [initialVariantId]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await searchVariantsAction(term);
      setLoading(false);
      if (r.ok) setResults(r.data);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  async function fromBarcode(code: string) {
    const r = await lookupBarcodeAction(code);
    if (!r.ok) return void toast.error(r.error);
    if (r.data.status === "not_found") {
      toast.error("Código não cadastrado.", { description: "Use o Scanner para o cadastro rápido deste produto." });
      return;
    }
    onChange(r.data.variant);
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-olive bg-sage-mist p-3">
        <ProductImage
          src={value.image}
          alt={value.productName}
          kind={value.variantKind}
          tint={swatchFor(value.details.find((d) => d.label === "Cor")?.value, value.colorHex)}
          monogram={false}
          sizes="56px"
          className="size-14 shrink-0 rounded-xl"
          artClassName="h-[80%]"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{value.productName}</p>
          <p className="text-sm text-stone-ink">
            {value.label} · SKU {value.sku}
          </p>
          <p className="text-sm">
            Estoque atual <strong className="tabular">{value.stock}</strong> · {formatBRL(value.price)}
          </p>
        </div>
        <button type="button" onClick={() => onChange(null)} aria-label="Trocar variante" className="inline-flex size-9 items-center justify-center rounded-full hover:bg-white/60">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-ink" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Produto, cor, SKU ou código de barras"
            aria-label="Buscar variante"
            className="h-12 w-full rounded-xl border border-input bg-paper pr-3 pl-10 text-sm outline-none focus:border-sage"
          />
          {loading ? <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-stone-ink" /> : null}
        </div>
        <ScanButton onCode={fromBarcode} />
      </div>
      {q.trim().length >= 2 ? (
        <ul className="max-h-80 overflow-y-auto rounded-2xl border border-hairline bg-paper p-1.5">
          {results.length ? (
            results.map((v) => (
              <li key={v.variantId}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(v);
                    setQ("");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-linen"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{v.productName}</span>
                    <span className="block truncate text-xs text-stone-ink">
                      {v.label} · {v.sku}
                    </span>
                  </span>
                  <span className="text-xs font-semibold tabular">{v.stock} un.</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-5 text-center text-sm text-stone-ink">{loading ? "Buscando…" : "Nenhuma variante encontrada."}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
