"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { CategoryDTO, PosVariant } from "@/types/catalog";
import type { UserRole } from "@/lib/constants";

// Carrinho do PDV: cada linha é uma VARIANTE (nunca só o produto).
export type PosLine = { variant: PosVariant; quantity: number };

type AddResult = "added" | "incremented" | "no-stock";

type PosContextValue = {
  lines: PosLine[];
  ready: boolean;
  itemCount: number;
  subtotalCents: number;
  categories: CategoryDTO[];
  role: UserRole;
  add: (variant: PosVariant, quantity?: number) => AddResult;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  updateVariants: (variants: PosVariant[]) => void;
};

const PosContext = createContext<PosContextValue | null>(null);
const KEY = "ug-pdv-carrinho-v1";

export function PosProvider({
  children,
  categories,
  role,
}: {
  children: ReactNode;
  categories: CategoryDTO[];
  role: UserRole;
}) {
  const [lines, setLines] = useState<PosLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restaura a venda em andamento
      if (raw) setLines(JSON.parse(raw) as PosLine[]);
    } catch {
      // venda em andamento indisponível: começa vazia
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      // sem armazenamento: o carrinho vale só nesta aba
    }
  }, [lines, ready]);

  const add = useCallback(
    (variant: PosVariant, quantity = 1): AddResult => {
      const existing = lines.find((l) => l.variant.variantId === variant.variantId);
      const nextQty = (existing?.quantity ?? 0) + quantity;
      if (nextQty > variant.stock) {
        toast.error("Estoque insuficiente.", {
          description: `${variant.productName} · ${variant.label}: ${variant.stock} em estoque.`,
        });
        return "no-stock";
      }
      setLines((current) =>
        existing
          ? current.map((l) =>
              l.variant.variantId === variant.variantId ? { variant, quantity: l.quantity + quantity } : l,
            )
          : [{ variant, quantity }, ...current],
      );
      return existing ? "incremented" : "added";
    },
    [lines],
  );

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((current) => {
      const line = current.find((l) => l.variant.variantId === variantId);
      if (!line) return current;
      if (quantity > line.variant.stock) {
        toast.error("Estoque insuficiente.", { description: `Há ${line.variant.stock} em estoque.` });
        return current;
      }
      if (quantity <= 0) return current.filter((l) => l.variant.variantId !== variantId);
      return current.map((l) => (l.variant.variantId === variantId ? { ...l, quantity } : l));
    });
  }, []);

  const remove = useCallback((variantId: string) => {
    setLines((current) => current.filter((l) => l.variant.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const updateVariants = useCallback((variants: PosVariant[]) => {
    setLines((current) =>
      current.map((l) => {
        const fresh = variants.find((v) => v.variantId === l.variant.variantId);
        return fresh ? { ...l, variant: fresh } : l;
      }),
    );
  }, []);

  const value = useMemo<PosContextValue>(
    () => ({
      lines,
      ready,
      itemCount: lines.reduce((s, l) => s + l.quantity, 0),
      subtotalCents: lines.reduce((s, l) => s + Math.round(l.variant.price * 100) * l.quantity, 0),
      categories,
      role,
      add,
      setQuantity,
      remove,
      clear,
      updateVariants,
    }),
    [lines, ready, categories, role, add, setQuantity, remove, clear, updateVariants],
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error("usePos precisa estar dentro de <PosProvider>");
  return ctx;
}
