"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Bell, ExternalLink, LogOut, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { Wordmark } from "@/components/shared/wordmark";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/actions/auth-actions";
import { ADMIN_NAV, MOBILE_NAV_HREFS, type NavItem } from "@/components/admin/nav";

type Counts = { orders: number; lowStock: number };
type ShellUser = { name: string; email: string; role: UserRole };

function isActive(pathname: string, href: string) {
  if (href === "/pdv") return pathname === "/pdv";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  items,
  pathname,
  counts,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  counts: Counts;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const count = item.badge ? counts[item.badge] : 0;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3.5 text-[0.9rem] font-medium transition-colors",
                active ? "bg-sage-light text-secondary-foreground" : "text-ink/85 hover:bg-[#ebe4d8] hover:text-ink",
              )}
            >
              <item.icon className={cn("size-[1.15rem]", active ? "text-olive" : "text-stone-ink")} strokeWidth={1.7} />
              <span className="flex-1">{item.label}</span>
              {count > 0 ? (
                <span
                  className={cn(
                    "min-w-6 rounded-full px-1.5 text-center text-[0.72rem] leading-6 font-bold tabular",
                    item.badge === "lowStock" ? "bg-gold-mist text-gold-ink" : "bg-olive text-offwhite",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarFoot() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-sage-light px-4 py-5">
      <p className="font-serif text-[1.35rem] leading-[1.05] font-medium text-ink">
        Moda, make & perfume para você
      </p>
      <p className="font-script text-[2.1rem] leading-[0.9] text-gold-ink">brilhar</p>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function AdminShell({
  user,
  counts,
  children,
}: {
  user: ShellUser;
  counts: Counts;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");
  const items = ADMIN_NAV.filter((i) => can(user.role, i.permission));
  const mobileItems = MOBILE_NAV_HREFS.map((h) => items.find((i) => i.href === h)).filter(
    (i): i is NavItem => Boolean(i),
  );
  const alerts = counts.orders + counts.lowStock;

  function search(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/admin/produtos?q=${encodeURIComponent(term)}`);
  }

  return (
    <div className="flex min-h-dvh bg-offwhite">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-[15.5rem] shrink-0 flex-col border-r border-hairline bg-sidebar px-3 py-6 lg:flex">
        <Link href="/admin/dashboard" className="px-3.5 pb-8">
          <Wordmark tone="olive" size="sm" />
        </Link>
        <nav aria-label="Painel" className="no-scrollbar flex-1 overflow-y-auto">
          <NavLinks items={items} pathname={pathname} counts={counts} />
        </nav>
        <div className="pt-4">
          <SidebarFoot />
        </div>
      </aside>

      {/* Drawer celular */}
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" showCloseButton={false} className="w-[82vw] max-w-xs border-none bg-sidebar px-3 py-5">
          <SheetTitle className="sr-only">Menu do painel</SheetTitle>
          <div className="flex items-center justify-between px-3.5 pb-6">
            <Wordmark tone="olive" size="sm" />
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Fechar menu"
              className="inline-flex size-10 items-center justify-center rounded-full hover:bg-[#ebe4d8]"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav aria-label="Painel" className="flex-1 overflow-y-auto">
            <NavLinks items={items} pathname={pathname} counts={counts} onNavigate={() => setDrawer(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-hairline bg-offwhite/90 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Abrir menu"
              className="inline-flex size-10 items-center justify-center rounded-xl hover:bg-linen lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <Link href="/admin/dashboard" className="lg:hidden">
              <Wordmark tone="olive" size="sm" />
            </Link>
            <form role="search" onSubmit={search} className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-ink" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar produto, SKU ou código de barras"
                aria-label="Buscar produtos"
                className="h-11 w-full rounded-xl border border-hairline bg-linen/70 pr-3 pl-10 text-sm outline-none placeholder:text-stone-ink focus:border-sage focus:bg-paper"
              />
            </form>
            <div className="ml-auto flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Alertas: ${alerts}`}
                    className="relative inline-flex size-10 items-center justify-center rounded-xl text-ink hover:bg-linen"
                  >
                    <Bell className="size-5" strokeWidth={1.7} />
                    {alerts > 0 ? (
                      <span className="absolute top-1 right-1 flex min-w-4.5 items-center justify-center rounded-full bg-rose-deep px-1 text-[0.65rem] leading-4.5 font-bold text-offwhite tabular">
                        {alerts}
                      </span>
                    ) : null}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-xl p-1.5">
                  <DropdownMenuLabel>Alertas</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/pedidos?status=AGUARDANDO_PAGAMENTO" className="flex justify-between">
                      Pedidos aguardando pagamento <span className="font-bold tabular">{counts.orders}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/estoque?filtro=low" className="flex justify-between">
                      Variantes com estoque baixo <span className="font-bold tabular">{counts.lowStock}</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex items-center gap-3 rounded-xl p-1 pr-2 hover:bg-linen">
                    <span className="flex size-9 items-center justify-center rounded-full bg-olive text-sm font-semibold text-offwhite">
                      {initials(user.name)}
                    </span>
                    <span className="hidden text-left leading-tight sm:block">
                      <span className="block text-sm font-semibold">{user.name}</span>
                      <span className="block text-xs text-stone-ink">{ROLE_LABELS[user.role]}</span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
                  <DropdownMenuLabel className="font-normal">
                    <span className="block font-semibold">{user.name}</span>
                    <span className="block text-xs text-stone-ink">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/" target="_blank">
                      <ExternalLink /> Ver loja
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => logoutAction()}>
                    <LogOut /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">{children}</main>
      </div>

      {/* Navegação inferior no celular */}
      <nav
        aria-label="Atalhos"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper/95 backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
          {mobileItems.map((item) => {
            const active = isActive(pathname, item.href);
            const center = item.href === "/pdv";
            return (
              <li key={item.href} className="flex">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 text-[0.68rem] font-semibold",
                    active ? "text-olive" : "text-stone-ink",
                  )}
                >
                  {center ? (
                    <span className="-mt-6 flex size-13 items-center justify-center rounded-2xl bg-olive text-offwhite shadow-lift">
                      <item.icon className="size-6" strokeWidth={1.8} />
                    </span>
                  ) : (
                    <item.icon className="size-[1.35rem]" strokeWidth={active ? 2 : 1.7} />
                  )}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
