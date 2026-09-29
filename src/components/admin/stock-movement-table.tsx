import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { MOVEMENT_TYPE_LABELS, type InventoryMovementType } from "@/lib/constants";
import type { MovementDTO } from "@/types/catalog";

const TYPE_TONE: Record<InventoryMovementType, string> = {
  ENTRADA: "bg-[#e3efe5] text-[#2f6a3f]",
  VENDA_PDV: "bg-sage-light text-secondary-foreground",
  VENDA_ONLINE: "bg-[#ece8f6] text-[#4f4690]",
  AJUSTE: "bg-linen text-ink",
  DEVOLUCAO: "bg-[#e3efe5] text-[#2f6a3f]",
  CANCELAMENTO: "bg-gold-mist text-gold-ink",
  PERDA: "bg-rose-mist text-rose-deep",
};

function referenceHref(m: MovementDTO) {
  if (m.referenceType === "ORDER" && m.referenceId) return `/admin/pedidos/${m.referenceId}`;
  if (m.referenceType === "SALE" && m.referenceId) return `/admin/vendas/${m.referenceId}`;
  return null;
}

// Linha de custódia: cada mudança de estoque com antes → depois, quem e por quê.
export function StockMovementTable({ items, showProduct = true }: { items: MovementDTO[]; showProduct?: boolean }) {
  return (
    <div className="relative overflow-x-auto rounded-2xl border border-hairline bg-paper shadow-soft">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-xs text-stone-ink">
            <th className="px-4 py-3 font-semibold">Data</th>
            {showProduct ? <th className="px-3 py-3 font-semibold">Produto · variante</th> : null}
            <th className="px-3 py-3 font-semibold">Tipo</th>
            <th className="px-3 py-3 text-right font-semibold">Qtd.</th>
            <th className="px-3 py-3 text-center font-semibold">Estoque</th>
            <th className="px-3 py-3 font-semibold">Motivo / referência</th>
            <th className="px-4 py-3 font-semibold">Usuário</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {items.map((m) => {
            const href = referenceHref(m);
            return (
              <tr key={m.id} className="hover:bg-offwhite">
                <td className="px-4 py-3 whitespace-nowrap text-stone-ink tabular">{formatDateTime(m.createdAt)}</td>
                {showProduct ? (
                  <td className="px-3 py-3">
                    <Link href={`/admin/estoque/movimentacoes?variante=${m.variantId}`} className="font-medium hover:text-olive">
                      {m.productName}
                    </Link>
                    <span className="block text-xs text-stone-ink">{m.variantLabel}</span>
                  </td>
                ) : null}
                <td className="px-3 py-3">
                  <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap", TYPE_TONE[m.type])}>
                    {MOVEMENT_TYPE_LABELS[m.type]}
                  </span>
                </td>
                <td className={cn("px-3 py-3 text-right font-bold tabular", m.quantity > 0 ? "text-[#2f6a3f]" : "text-rose-deep")}>
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </td>
                <td className="px-3 py-3 text-center whitespace-nowrap tabular">
                  <span className="text-stone-ink">{m.stockBefore}</span>
                  <span className="mx-1.5 text-stone">→</span>
                  <span className="font-semibold">{m.stockAfter}</span>
                </td>
                <td className="px-3 py-3 text-xs">
                  {href && m.referenceLabel ? (
                    <Link href={href} className="font-semibold text-olive hover:underline">
                      {m.referenceLabel}
                    </Link>
                  ) : null}
                  {m.reason && !(m.referenceLabel && m.reason.includes(`#`)) ? <span className="block text-stone-ink">{m.reason}</span> : null}
                  {m.supplier ? <span className="block text-stone-ink">Fornecedor: {m.supplier}</span> : null}
                  {m.unitCost !== null ? <span className="block text-stone-ink">Custo: {formatBRL(m.unitCost)}</span> : null}
                </td>
                <td className="px-4 py-3 text-xs text-stone-ink">{m.userName ?? (m.type === "VENDA_ONLINE" ? "Loja online" : "—")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
