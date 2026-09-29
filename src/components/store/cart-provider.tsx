"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// A sacola guarda só variantId + quantidade. Preço e estoque vêm sempre do servidor.
export type CartLine = { variantId: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  favorites: string[];
  toggleFavorite: (slug: string) => boolean;
  isFavorite: (slug: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "ug-sacola-v1";
const FAV_KEY = "ug-favoritos-v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // armazenamento indisponível (modo privado): a sacola vive só nesta aba
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = read<CartLine[]>(CART_KEY, []);
    const valid = Array.isArray(stored)
      ? stored.filter((l) => typeof l.variantId === "string" && Number.isInteger(l.quantity) && l.quantity > 0)
      : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação a partir do localStorage
    setLines(valid);
    setFavorites(read<string[]>(FAV_KEY, []));
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setLines(read<CartLine[]>(CART_KEY, []));
      if (e.key === FAV_KEY) setFavorites(read<string[]>(FAV_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    write(CART_KEY, next);
  }, []);

  const add = useCallback(
    (variantId: string, quantity = 1) => {
      const current = read<CartLine[]>(CART_KEY, lines);
      const existing = current.find((l) => l.variantId === variantId);
      const next = existing
        ? current.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(l.quantity + quantity, 99) } : l))
        : [...current, { variantId, quantity }];
      persist(next);
    },
    [lines, persist],
  );

  const setQuantity = useCallback(
    (variantId: string, quantity: number) => {
      persist(
        quantity <= 0
          ? lines.filter((l) => l.variantId !== variantId)
          : lines.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(quantity, 99) } : l)),
      );
    },
    [lines, persist],
  );

  const remove = useCallback(
    (variantId: string) => persist(lines.filter((l) => l.variantId !== variantId)),
    [lines, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const toggleFavorite = useCallback(
    (slug: string) => {
      const has = favorites.includes(slug);
      const next = has ? favorites.filter((s) => s !== slug) : [...favorites, slug];
      setFavorites(next);
      write(FAV_KEY, next);
      return !has;
    },
    [favorites],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      ready,
      add,
      setQuantity,
      remove,
      clear,
      favorites,
      toggleFavorite,
      isFavorite: (slug: string) => favorites.includes(slug),
    }),
    [lines, ready, add, setQuantity, remove, clear, favorites, toggleFavorite],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
