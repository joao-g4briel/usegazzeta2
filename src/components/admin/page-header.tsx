import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-stone-ink hover:text-olive"
          >
            <ChevronLeft className="size-4" /> {back.label}
          </Link>
        ) : null}
        <h1 className="font-serif text-[2.1rem] leading-tight font-medium text-ink sm:text-[2.5rem]">{title}</h1>
        {description ? <p className="mt-1 text-[0.95rem] text-stone-ink">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-hairline bg-paper shadow-soft", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <h2 className="font-serif text-[1.4rem] leading-tight font-semibold text-ink">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

export function FilterTabs({
  items,
  className,
}: {
  items: { label: string; href: string; active: boolean; count?: number }[];
  className?: string;
}) {
  return (
    <nav aria-label="Filtros" className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1", className)}>
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.active ? "page" : undefined}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors",
            i.active ? "border-olive bg-olive text-offwhite" : "border-hairline bg-paper text-ink hover:border-sage",
          )}
        >
          {i.label}
          {i.count !== undefined ? (
            <span className={cn("text-xs tabular", i.active ? "text-offwhite/80" : "text-stone-ink")}>({i.count})</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
