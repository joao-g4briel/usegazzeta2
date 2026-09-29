"use client";

import { useEffect, useRef, useState } from "react";
import { quoteCartAction } from "@/actions/store-actions";
import type { CartQuote } from "@/services/order-service";
import type { CartLine } from "@/components/store/cart-provider";

// Recalcula a sacola no servidor sempre que itens, cupom ou entrega mudam.
export function useCartQuote(
  lines: CartLine[],
  ready: boolean,
  couponCode: string | null,
  shippingMethod: "ENTREGA" | "RETIRADA",
) {
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const key = JSON.stringify([lines, couponCode, shippingMethod]);

  useEffect(() => {
    if (!ready) return;
    const id = ++seq.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- indica recálculo em andamento
    setLoading(true);
    const timer = setTimeout(async () => {
      const result = await quoteCartAction({ items: lines, couponCode, shippingMethod });
      if (id !== seq.current) return;
      if (result.ok) {
        setQuote(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 180);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a chave serializada cobre as dependências
  }, [key, ready]);

  return { quote, loading, error };
}
