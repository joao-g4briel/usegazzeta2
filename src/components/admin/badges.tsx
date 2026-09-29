import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";

const ORDER_TONES: Record<OrderStatus, string> = {
  AGUARDANDO_PAGAMENTO: "bg-gold-mist text-gold-ink",
  PAGO: "bg-sage-light text-secondary-foreground",
  EM_SEPARACAO: "bg-[#ece8f6] text-[#4f4690]",
  ENVIADO: "bg-[#fbf0dc] text-[#7a5514]",
  ENTREGUE: "bg-[#e3efe5] text-[#2f6a3f]",
  CANCELADO: "bg-rose-mist text-rose-deep",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold whitespace-nowrap",
        ORDER_TONES[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone =
    status === "PAID"
      ? "text-[#2f6a3f]"
      : status === "PENDING"
        ? "text-gold-ink"
        : "text-rose-deep";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", tone)}>
      <span className="size-1.5 rounded-full bg-current" />
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function SaleStatusBadge({ status }: { status: "COMPLETED" | "CANCELED" }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold",
        status === "COMPLETED" ? "bg-[#e3efe5] text-[#2f6a3f]" : "bg-rose-mist text-rose-deep",
      )}
    >
      {status === "COMPLETED" ? "Concluída" : "Cancelada"}
    </span>
  );
}
