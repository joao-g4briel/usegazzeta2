"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, Check, PackagePlus, Pencil, ScanSearch, ShoppingBasket, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { swatchFor } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { BarcodeScanner } from "@/components/shared/barcode-scanner";
import { ProductImage } from "@/components/shared/product-image";
import { lookupBarcodeAction } from "@/actions/inventory-actions";
import { usePos } from "@/components/pdv/pos-provider";
import { QuickRegisterForm } from "@/components/pdv/quick-register-form";
import type { PosVariant } from "@/types/catalog";

type Result =
  | { type: "added"; variant: PosVariant; quantity: number; created?: boolean }
  | { type: "info"; variant: PosVariant; inactive?: boolean }
  | { type: "not_found"; barcode: string }
  | { type: "error"; message: string };

function ProductResult({ result, mode }: { result: Extract<Result, { type: "added" | "info" }>; mode: "venda" | "consulta" }) {
  const v = result.variant;
  const lowStock = v.stock <= 2;
  return (
    <div className="flex animate-pop-in gap-4 rounded-3xl border border-hairline bg-paper p-3.5 shadow-soft">
      <ProductImage
        src={v.image}
        alt={v.productName}
        kind={v.variantKind}
        tint={swatchFor(v.details.find((d) => d.label === "Cor")?.value, v.colorHex)}
        monogram={false}
        sizes="96px"
        className="aspect-[4/5] w-20 shrink-0 rounded-2xl"
        artClassName="h-[78%]"
      />
      <div className="min-w-0 flex-1">
        {result.type === "added" ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-sage-light px-2.5 py-1 text-xs font-bold text-secondary-foreground">
            <Check className="size-3.5" /> {result.created ? "Produto cadastrado e adicionado" : "Produto adicionado"}
            {result.quantity > 1 ? ` · ${result.quantity} no carrinho` : ""}
          </p>
        ) : result.inactive ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-rose-mist px-2.5 py-1 text-xs font-bold text-rose-deep">Produto inativo</p>
        ) : null}
        <p className="mt-1.5 font-serif text-xl leading-tight font-semibold">{v.productName}</p>
        <p className="text-sm text-stone-ink">
          {v.details.map((d) => `${d.label}: ${d.value}`).join(" · ") || "Padrão"}
        </p>
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <span className="text-lg font-bold tabular">{formatBRL(v.price)}</span>
          <span className={cn("text-sm font-semibold tabular", v.stock <= 0 ? "text-rose-deep" : lowStock ? "text-gold-ink" : "text-olive")}>
            {v.stock <= 0 ? "Sem estoque" : `Estoque: ${v.stock}`}
          </span>
        </div>
        {mode === "consulta" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="soft">
              <Link href={`/admin/estoque/entrada?variante=${v.variantId}`}>
                <PackagePlus /> Entrada
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/produtos/${v.productId}`}>
                <Pencil /> Editar
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ScannerWorkspace({
  initialMode,
  layout,
  onClose,
}: {
  initialMode: "venda" | "consulta";
  layout: "overlay" | "page";
  onClose?: () => void;
}) {
  const pos = usePos();
  const canSell = can(pos.role, "pdv");
  const [mode, setMode] = useState<"venda" | "consulta">(canSell ? initialMode : "consulta");
  const [result, setResult] = useState<Result | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);
  const busy = useRef(false);

  async function onDetect(code: string) {
    if (busy.current || registering) return;
    busy.current = true;
    try {
      const r = await lookupBarcodeAction(code);
      if (!r.ok) {
        navigator.vibrate?.([80, 60, 80]);
        setResult({ type: "error", message: r.error });
        return;
      }
      if (r.data.status === "not_found") {
        navigator.vibrate?.([80, 60, 80]);
        setResult({ type: "not_found", barcode: r.data.barcode });
        setRegistering(r.data.barcode);
        return;
      }
      const variant = r.data.variant;
      if (mode === "consulta") {
        setResult({ type: "info", variant, inactive: !r.data.active });
        return;
      }
      if (!r.data.active) {
        setResult({ type: "error", message: `${variant.productName} (${variant.label}) está inativo e não pode ser vendido.` });
        return;
      }
      const existing = pos.lines.find((l) => l.variant.variantId === variant.variantId);
      const outcome = pos.add(variant);
      if (outcome === "no-stock") {
        navigator.vibrate?.([80, 60, 80]);
        setResult({ type: "error", message: `Estoque insuficiente: ${variant.productName} (${variant.label}) tem ${variant.stock} em estoque.` });
        return;
      }
      setResult({ type: "added", variant, quantity: (existing?.quantity ?? 0) + 1 });
    } finally {
      busy.current = false;
    }
  }

  const scanning = !registering;

  return (
    <div className={cn("flex flex-col", layout === "overlay" ? "fixed inset-0 z-50 bg-offwhite" : "flex-1")}>
      {layout === "overlay" ? (
        <div className="flex h-14 items-center justify-between bg-olive px-3 text-offwhite">
          <span className="pl-2 font-semibold">Escanear produtos</span>
          <button type="button" onClick={onClose} aria-label="Fechar scanner" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10">
            <X className="size-6" />
          </button>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-3 pt-3 pb-40 sm:px-5">
        {canSell ? (
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-linen p-1" role="tablist" aria-label="Modo do scanner">
            {(
              [
                ["venda", "Vender", ShoppingBasket],
                ["consulta", "Consultar", ScanSearch],
              ] as const
            ).map(([m, label, Icon]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setResult(null);
                }}
                className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold", mode === m ? "bg-paper shadow-soft" : "text-stone-ink")}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
        ) : null}

        {!registering ? (
          <BarcodeScanner
            active={scanning}
            onDetect={onDetect}
            className="aspect-[4/3.4] w-full shrink-0 sm:aspect-[16/11]"
          />
        ) : null}

        {result?.type === "added" || result?.type === "info" ? <ProductResult result={result} mode={mode} /> : null}

        {result?.type === "error" ? (
          <div role="alert" className="flex animate-pop-in items-start gap-3 rounded-3xl bg-rose-mist px-4 py-4 text-rose-deep">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm font-medium">{result.message}</p>
          </div>
        ) : null}

        {result?.type === "not_found" ? (
          <div className="flex animate-pop-in items-start gap-4 rounded-3xl bg-[#f8ecdf] px-5 py-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold text-2xl font-bold text-ink">!</span>
            <div className="flex-1">
              <p className="font-serif text-2xl leading-tight font-semibold text-[#6f4d12]">Produto não cadastrado</p>
              <p className="mt-1 text-sm text-ink/80">
                Este código de barras ainda não está em nosso sistema. Cadastre o produto para adicioná-lo ao seu estoque.
              </p>
              <p className="mt-1 text-xs text-stone-ink tabular">Código {result.barcode}</p>
              {!registering ? (
                <Button className="mt-3" onClick={() => setRegistering(result.barcode)}>
                  <Sparkles /> Cadastro rápido
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {registering ? (
          <div className="rounded-3xl border border-hairline bg-paper p-5 shadow-soft">
            <QuickRegisterForm
              barcode={registering}
              categories={pos.categories}
              addToCart={mode === "venda"}
              onCancel={() => {
                setRegistering(null);
                setResult(null);
              }}
              onDone={(variant, info) => {
                setRegistering(null);
                if (mode === "venda") {
                  const outcome = pos.add(variant);
                  if (outcome !== "no-stock") {
                    toast.success("Produto cadastrado e adicionado");
                    setResult({ type: "added", variant, quantity: 1, created: true });
                  } else {
                    setResult({ type: "info", variant });
                  }
                } else {
                  toast.success(info.createdProduct ? "Produto cadastrado com sucesso" : "Variante cadastrada com sucesso");
                  setResult({ type: "info", variant });
                }
              }}
            />
          </div>
        ) : null}
      </div>

      {mode === "venda" && canSell ? (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-paper/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <div className="flex-1">
              <p className="text-xs text-stone-ink">
                {pos.itemCount} {pos.itemCount === 1 ? "item" : "itens"} no carrinho
              </p>
              <p className="text-xl font-bold tabular">{formatBRL(pos.subtotalCents / 100)}</p>
            </div>
            {layout === "overlay" ? (
              <Button size="xl" onClick={onClose}>
                Concluir <ArrowRight />
              </Button>
            ) : (
              <Button size="xl" asChild>
                <Link href="/pdv">
                  Ver carrinho <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
