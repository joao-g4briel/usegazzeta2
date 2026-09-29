"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Busca com atualização da URL (as páginas são renderizadas no servidor).
export function AdminSearch({
  placeholder,
  basePath,
  params = {},
  paramName = "q",
  initial,
  className,
}: {
  placeholder: string;
  basePath: string;
  params?: Record<string, string | undefined>;
  paramName?: string;
  initial?: string;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (initial !== undefined) return;
    const current = new URLSearchParams(window.location.search).get(paramName) ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- valor inicial vindo da URL
    setValue(current);
  }, [initial, paramName]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
      if (value.trim()) p.set(paramName, value.trim());
      const qs = p.toString();
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara apenas ao digitar
  }, [value]);

  return (
    <div className={cn("relative w-full lg:w-80", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-ink" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-xl border border-hairline bg-paper pr-9 pl-10 text-sm outline-none placeholder:text-stone-ink focus:border-sage"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-stone-ink hover:bg-linen"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
