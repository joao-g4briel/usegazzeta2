"use client";

import Link from "next/link";
import { Fragment, useState, useTransition } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, ChevronDown, History, MoreHorizontal, PackagePlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { swatchFor } from "@/lib/constants";
import { ProductImage } from "@/components/shared/product-image";
import { StockBadge } from "@/components/shared/stock-badge";
import { setProductActiveAction } from "@/actions/product-actions";
import type { AdminProductRow } from "@/types/catalog";

const CATEGORY_TONE: Record<string, string> = {
  APPAREL: "bg-sage-light text-secondary-foreground",
  BEAUTY: "bg-rose-mist text-rose-deep",
  FRAGRANCE: "bg-[#efe4d4] text-gold-ink",
  ACCESSORY: "bg-cream text-ink",
  OTHER: "bg-linen text-ink",
};

function StatusPill({ row }: { row: AdminProductRow }) {
  if (!row.active) return <span className="text-xs font-semibold text-stone-ink">Arquivado</span>;
  const tone =
    row.totalStock <= 0
      ? "bg-rose-mist text-rose-deep"
      : row.lowStockCount + row.outOfStockCount > 0
        ? "bg-gold-mist text-gold-ink"
        : "bg-[#e3efe5] text-[#2f6a3f]";
  const label = row.totalStock <= 0 ? "Esgotado" : row.lowStockCount + row.outOfStockCount > 0 ? "Baixo" : "Ativo";
  return (
    <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold", tone)}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function RowActions({ row }: { row: AdminProductRow }) {
  const [pending, start] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${row.name}`} disabled={pending}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
        <DropdownMenuItem asChild>
          <Link href={`/admin/produtos/${row.id}`}>
            <Pencil /> Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/estoque/movimentacoes?produto=${row.id}`}>
            <History /> Movimentações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/produtos/${row.slug}`} target="_blank">
            Ver na loja
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            start(async () => {
              const r = await setProductActiveAction(row.id, !row.active);
              if (r.ok) toast.success(r.message);
              else toast.error(r.error);
            })
          }
        >
          {row.active ? <Archive /> : <ArchiveRestore />} {row.active ? "Arquivar" : "Reativar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function VariantRows({ row }: { row: AdminProductRow }) {
  return (
    <div className="rounded-2xl bg-offwhite p-3 sm:p-4">
      <p className="mb-2 px-1 text-xs font-semibold text-stone-ink">
        Estoque total <span className="text-ink tabular">{row.totalStock}</span> · {row.variants.length}{" "}
        {row.variants.length === 1 ? "variante" : "variantes"}
      </p>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-ink">
              <th className="px-2 py-2 font-semibold">Variante</th>
              <th className="px-2 py-2 font-semibold">SKU</th>
              <th className="px-2 py-2 font-semibold">Código de barras</th>
              <th className="px-2 py-2 text-right font-semibold">Preço</th>
              <th className="px-2 py-2 text-right font-semibold">Mín.</th>
              <th className="px-2 py-2 font-semibold">Estoque</th>
              <th className="px-2 py-2"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {row.variants.map((v) => {
              const swatch = swatchFor(v.color, v.colorHex);
              return (
                <tr key={v.id} className={cn(!v.active && "opacity-50")}>
                  <td className="px-2 py-2.5">
                    <span className="flex items-center gap-2 font-medium">
                      {swatch ? <span className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: swatch }} /> : null}
                      {v.label}
                      {!v.active ? <span className="text-xs text-stone-ink">(inativa)</span> : null}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-xs">{v.sku}</td>
                  <td className="px-2 py-2.5 text-xs tabular">{v.barcode ?? <span className="text-stone-ink">—</span>}</td>
                  <td className="px-2 py-2.5 text-right tabular">
                    {v.promotionalPrice ? <span className="mr-1.5 text-xs text-stone-ink line-through">{formatBRL(v.salePrice)}</span> : null}
                    {formatBRL(v.price)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-stone-ink tabular">{v.minimumStock}</td>
                  <td className="px-2 py-2.5">
                    <StockBadge stock={v.stock} minimumStock={v.minimumStock} />
                  </td>
                  <td className="px-2 py-2.5 text-right whitespace-nowrap">
                    <Link href={`/admin/estoque/entrada?variante=${v.id}`} className="mr-1 inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-olive hover:bg-sage-mist">
                      <PackagePlus className="size-3.5" /> Entrada
                    </Link>
                    <Link href={`/admin/estoque/movimentacoes?variante=${v.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-stone-ink hover:bg-linen">
                      <History className="size-3.5" /> Histórico
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProductTable({ rows, highlight }: { rows: AdminProductRow[]; highlight?: string | null }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(highlight ? [highlight] : []));
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="rounded-2xl border border-hairline bg-paper shadow-soft">
      {/* desktop */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-hairline text-left text-xs text-stone-ink">
            <th className="w-10 py-3.5 pl-4"><span className="sr-only">Expandir</span></th>
            <th className="py-3.5 pr-3 font-semibold">Produto</th>
            <th className="py-3.5 pr-3 font-semibold">SKU</th>
            <th className="py-3.5 pr-3 font-semibold">Categoria</th>
            <th className="py-3.5 pr-3 text-right font-semibold">Estoque total</th>
            <th className="py-3.5 pr-3 text-right font-semibold">Preço inicial</th>
            <th className="py-3.5 pr-3 font-semibold">Status</th>
            <th className="py-3.5 pr-4 text-right font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const expanded = open.has(row.id);
            const skus = row.variants.map((v) => v.sku);
            const tint = swatchFor(row.variants.find((v) => v.color)?.color);
            return (
              <Fragment key={row.id}>
                <tr
                  className={cn("cursor-pointer border-b border-hairline transition-colors hover:bg-offwhite", expanded && "bg-offwhite", !row.active && "opacity-60")}
                  onClick={() => toggle(row.id)}
                >
                  <td className="py-3 pl-4">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-label={`${expanded ? "Recolher" : "Ver"} variantes de ${row.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(row.id);
                      }}
                      className="inline-flex size-7 items-center justify-center rounded-lg hover:bg-linen"
                    >
                      <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
                    </button>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <ProductImage src={row.image} alt={row.name} kind={row.category.variantKind} tint={tint} monogram={false} sizes="48px" className="size-12 shrink-0 rounded-xl" artClassName="h-[80%]" />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{row.name}</p>
                        <p className="text-xs text-stone-ink">
                          {row.variants.length} {row.variants.length === 1 ? "variante" : "variantes"}
                          {row.brand ? ` · ${row.brand}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-stone-ink">
                    {skus[0]}
                    {skus.length > 1 ? <span className="font-sans"> +{skus.length - 1}</span> : null}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={cn("inline-flex h-7 items-center rounded-lg px-2.5 text-xs font-semibold", CATEGORY_TONE[row.category.variantKind])}>
                      {row.category.name}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right font-semibold tabular">{row.totalStock}</td>
                  <td className="py-3 pr-3 text-right whitespace-nowrap tabular">
                    {row.priceFrom !== row.priceTo ? <span className="mr-1 text-xs text-stone-ink">a partir de</span> : null}
                    {formatBRL(row.priceFrom)}
                  </td>
                  <td className="py-3 pr-3">
                    <StatusPill row={row} />
                  </td>
                  <td className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/admin/produtos/${row.id}`} aria-label={`Editar ${row.name}`} className="mr-1 inline-flex size-8 items-center justify-center rounded-lg hover:bg-linen">
                      <Pencil className="size-4" />
                    </Link>
                    <RowActions row={row} />
                  </td>
                </tr>
                {expanded ? (
                  <tr className="border-b border-hairline">
                    <td colSpan={8} className="px-4 pt-1 pb-4">
                      <VariantRows row={row} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {/* celular */}
      <ul className="divide-y divide-hairline md:hidden">
        {rows.map((row) => {
          const expanded = open.has(row.id);
          return (
            <li key={row.id} className={cn(!row.active && "opacity-60")}>
              <div className="flex items-center gap-3 p-4">
                <button type="button" onClick={() => toggle(row.id)} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <ProductImage src={row.image} alt={row.name} kind={row.category.variantKind} tint={swatchFor(row.variants.find((v) => v.color)?.color)} monogram={false} sizes="56px" className="size-14 shrink-0 rounded-xl" artClassName="h-[80%]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{row.name}</p>
                    <p className="text-xs text-stone-ink">
                      {row.category.name} · {formatBRL(row.priceFrom)}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs">
                      <span className="font-semibold tabular">{row.totalStock} em estoque</span>
                      <StatusPill row={row} />
                    </p>
                  </div>
                  <ChevronDown className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")} />
                </button>
                <RowActions row={row} />
              </div>
              {expanded ? (
                <div className="px-4 pb-4">
                  <ul className="divide-y divide-hairline rounded-2xl bg-offwhite px-3">
                    {row.variants.map((v) => (
                      <li key={v.id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{v.label}</p>
                          <p className="truncate font-mono text-[0.7rem] text-stone-ink">
                            {v.sku} · {v.barcode ?? "sem código"}
                          </p>
                        </div>
                        <StockBadge stock={v.stock} minimumStock={v.minimumStock} />
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="soft" size="sm" className="mt-3 w-full">
                    <Link href={`/admin/produtos/${row.id}`}>
                      <Pencil /> Editar produto
                    </Link>
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
