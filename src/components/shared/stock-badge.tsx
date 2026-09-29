import { cn } from "@/lib/utils";
import { adminStockLevel, stockState, STOCK_STATE_LABELS } from "@/lib/variant";

// Loja: "Em estoque", "Últimas unidades", "Última unidade", "Esgotado".
export function StoreStockNote({ stock, className }: { stock: number; className?: string }) {
  const state = stockState(stock);
  const tone =
    state === "out_of_stock"
      ? "text-stone-ink"
      : state === "in_stock"
        ? "text-olive"
        : "text-rose-deep";
  const dot =
    state === "out_of_stock" ? "bg-stone" : state === "in_stock" ? "bg-sage" : "bg-rose-deep";
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium", tone, className)}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {STOCK_STATE_LABELS[state]}
      {state === "last_units" ? <span className="text-stone-ink font-normal">· restam {stock}</span> : null}
    </span>
  );
}

// Painel: alerta por variante (estoque ≤ mínimo da própria variante).
export function StockBadge({
  stock,
  minimumStock,
  className,
  showCount = true,
}: {
  stock: number;
  minimumStock: number;
  className?: string;
  showCount?: boolean;
}) {
  const level = adminStockLevel(stock, minimumStock);
  const styles =
    level === "out"
      ? "bg-rose-mist text-rose-deep"
      : level === "low"
        ? "bg-gold-mist text-gold-ink"
        : "bg-sage-mist text-olive";
  const label = level === "out" ? "Sem estoque" : level === "low" ? "Estoque baixo" : "Normal";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap tabular",
        styles,
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          level === "out" ? "bg-rose-deep" : level === "low" ? "bg-gold" : "bg-sage",
        )}
      />
      {showCount ? `${stock} un.` : label}
    </span>
  );
}

export function StockLevelLabel({ stock, minimumStock }: { stock: number; minimumStock: number }) {
  const level = adminStockLevel(stock, minimumStock);
  if (level === "ok") return null;
  return (
    <span
      className={cn(
        "text-[0.68rem] font-bold tracking-[0.08em] uppercase",
        level === "out" ? "text-rose-deep" : "text-gold-ink",
      )}
    >
      {level === "out" ? "Esgotado" : "Estoque baixo"}
    </span>
  );
}
