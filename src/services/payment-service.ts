import { DomainError } from "@/lib/errors";
import { formatCents, toCents } from "@/lib/money";
import type { PaymentMethod } from "@/lib/constants";

export type PaymentRequest = {
  method: PaymentMethod;
  amount: number | null;
  receivedAmount: number | null;
  installments?: number | null;
};

export type ResolvedPayment = {
  method: PaymentMethod;
  amountCents: number;
  receivedCents: number | null;
  changeCents: number | null;
  installments: number | null;
};

/**
 * Resolve os pagamentos da venda. Já suporta pagamento dividido
 * (ex.: parte Pix, parte dinheiro): a soma precisa fechar o total.
 * Uma única forma sem valor informado paga o total inteiro.
 */
export function resolvePayments(requests: PaymentRequest[], totalCents: number): ResolvedPayment[] {
  if (!requests.length) throw new DomainError("Escolha a forma de pagamento.", "PAYMENT_REQUIRED");

  const resolved: ResolvedPayment[] = [];
  let remaining = totalCents;

  requests.forEach((req, index) => {
    const isLast = index === requests.length - 1;
    let amount = req.amount === null ? (isLast ? remaining : 0) : toCents(req.amount);
    if (amount <= 0 && totalCents > 0) {
      throw new DomainError("Informe o valor de cada forma de pagamento.", "PAYMENT_AMOUNT");
    }
    amount = Math.min(amount, Math.max(remaining, 0));

    let receivedCents: number | null = null;
    let changeCents: number | null = null;
    if (req.method === "DINHEIRO") {
      receivedCents = req.receivedAmount === null ? amount : toCents(req.receivedAmount);
      if (receivedCents < amount) {
        throw new DomainError(
          `Valor recebido (${formatCents(receivedCents)}) é menor que o valor em dinheiro (${formatCents(amount)}).`,
          "CASH_SHORT",
          "receivedAmount",
        );
      }
      changeCents = receivedCents - amount;
    }

    resolved.push({
      method: req.method,
      amountCents: amount,
      receivedCents,
      changeCents,
      installments: req.method === "CREDITO" ? (req.installments ?? 1) : null,
    });
    remaining -= amount;
  });

  if (remaining !== 0) {
    throw new DomainError(
      `Os pagamentos somam ${formatCents(totalCents - remaining)}, mas o total é ${formatCents(totalCents)}.`,
      "PAYMENT_MISMATCH",
    );
  }
  return resolved;
}

export function changeFor(totalCents: number, receivedCents: number) {
  return Math.max(0, receivedCents - totalCents);
}
