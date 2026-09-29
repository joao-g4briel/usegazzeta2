"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { updateOrderStatusAction } from "@/actions/order-actions";
import { cancelSaleAction } from "@/actions/sale-actions";

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  AGUARDANDO_PAGAMENTO: "Confirmar pagamento",
  PAGO: "Iniciar separação",
  EM_SEPARACAO: "Marcar como enviado",
  ENVIADO: "Marcar como entregue",
};

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, start] = useTransition();
  const index = ORDER_STATUS_FLOW.indexOf(status);
  const next = index >= 0 && index < ORDER_STATUS_FLOW.length - 1 ? ORDER_STATUS_FLOW[index + 1] : null;

  function update(target: OrderStatus) {
    start(async () => {
      const r = await updateOrderStatusAction({ orderId, status: target });
      if (r.ok) toast.success(r.message ?? "Pedido atualizado");
      else toast.error(r.error);
    });
  }

  if (status === "CANCELADO") {
    return <p className="rounded-xl bg-rose-mist px-4 py-3 text-sm font-medium text-rose-deep">Pedido cancelado. As peças voltaram ao estoque.</p>;
  }

  return (
    <div className="space-y-4">
      <ol className="grid grid-cols-5 gap-1.5" aria-label="Etapas do pedido">
        {ORDER_STATUS_FLOW.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              disabled={pending || s === status}
              onClick={() => update(s)}
              title={`Mudar para ${ORDER_STATUS_LABELS[s]}`}
              className="group flex w-full flex-col gap-1.5 text-left disabled:cursor-default"
            >
              <span className={cn("h-1.5 rounded-full transition-colors", i <= index ? "bg-olive" : "bg-beige group-hover:bg-sage-light")} />
              <span className={cn("text-[0.7rem] leading-tight", i <= index ? "font-semibold text-ink" : "text-stone-ink")}>
                {ORDER_STATUS_LABELS[s]}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        {next ? (
          <Button onClick={() => update(next)} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {NEXT_LABEL[status]} <ArrowRight />
          </Button>
        ) : null}
        {status !== "ENTREGUE" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={pending}>
                <XCircle /> Cancelar pedido
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Cancelar este pedido?</AlertDialogTitle>
              <AlertDialogDescription>
                As peças voltam para o estoque (movimentação CANCELAMENTO) e o pagamento fica como estornado/cancelado. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={() => update("CANCELADO")}>Cancelar pedido</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}

export function CancelSaleButton({ saleId }: { saleId: string }) {
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <XCircle />} Cancelar venda
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Cancelar esta venda?</AlertDialogTitle>
        <AlertDialogDescription>
          As peças voltam ao estoque e os pagamentos ficam como estornados. Use para desfazer uma venda registrada por engano ou uma devolução completa.
        </AlertDialogDescription>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (opcional)" />
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              start(async () => {
                const r = await cancelSaleAction(saleId, reason);
                if (r.ok) toast.success(r.message ?? "Venda cancelada");
                else toast.error(r.error);
              })
            }
          >
            Cancelar venda
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
