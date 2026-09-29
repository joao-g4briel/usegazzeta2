"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, EllipsisVertical, LayoutDashboard, LogOut, ReceiptText, ScanBarcode, ShoppingBasket, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wordmark } from "@/components/shared/wordmark";
import { logoutAction } from "@/actions/auth-actions";
import { can } from "@/lib/permissions";
import { usePos } from "@/components/pdv/pos-provider";

export function PosHeader() {
  const pathname = usePathname();
  const { role, itemCount } = usePos();
  const onScanner = pathname.startsWith("/pdv/scanner");
  const back = onScanner && can(role, "pdv") ? "/pdv" : can(role, "dashboard") ? "/admin/dashboard" : can(role, "inventory") ? "/admin/estoque" : "/pdv";

  return (
    <header className="sticky top-0 z-40 bg-olive text-offwhite">
      <div className="mx-auto flex h-[4.25rem] max-w-[1400px] items-center gap-2 px-3 sm:px-5">
        <Link
          href={back}
          aria-label="Voltar"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
        >
          <ArrowLeft className="size-6" strokeWidth={1.7} />
        </Link>
        <div className="flex min-w-0 flex-1 justify-center sm:justify-start">
          <Wordmark tone="light" size="sm" subtitle={onScanner ? "Scanner" : "PDV • Venda presencial"} />
        </div>
        <span className="hidden h-11 items-center gap-2.5 rounded-2xl border border-white/35 px-3.5 text-left text-xs leading-tight sm:inline-flex">
          <Store className="size-5" strokeWidth={1.6} />
          <span>
            Loja física
            <span className="block text-offwhite/85">Use Gazzeta</span>
          </span>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Mais opções" className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10">
              <EllipsisVertical className="size-5" />
              {onScanner && itemCount ? (
                <span className="absolute top-1.5 right-1 min-w-4.5 rounded-full bg-gold px-1 text-[0.65rem] leading-4.5 font-bold text-ink tabular">{itemCount}</span>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
            {can(role, "pdv") ? (
              <DropdownMenuItem asChild>
                <Link href="/pdv">
                  <ShoppingBasket /> Carrinho de venda {itemCount ? `(${itemCount})` : ""}
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <Link href="/pdv/scanner">
                <ScanBarcode /> Scanner
              </Link>
            </DropdownMenuItem>
            {can(role, "orders") ? (
              <DropdownMenuItem asChild>
                <Link href="/admin/pedidos?canal=loja">
                  <ReceiptText /> Vendas presenciais
                </Link>
              </DropdownMenuItem>
            ) : null}
            {can(role, "dashboard") ? (
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard">
                  <LayoutDashboard /> Painel
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logoutAction()}>
              <LogOut /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
