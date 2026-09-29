import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { swatchFor } from "@/lib/constants";

export function Price({
  value,
  compareAt,
  className,
  size = "md",
}: {
  value: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const main = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 tabular", className)}>
      {compareAt ? (
        <span className="text-sm text-stone-ink line-through decoration-stone/60">{formatBRL(compareAt)}</span>
      ) : null}
      <span className={cn("font-semibold text-ink", main)}>{formatBRL(value)}</span>
    </span>
  );
}

export function ColorDot({
  color,
  hex,
  className,
}: {
  color?: string | null;
  hex?: string | null;
  className?: string;
}) {
  const fill = swatchFor(color, hex);
  if (!fill) return null;
  return (
    <span
      aria-hidden
      className={cn("inline-block size-3 shrink-0 rounded-full ring-1 ring-black/10", className)}
      style={{ backgroundColor: fill }}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#dcd2c2] bg-paper/60 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-sage-mist text-olive [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm space-y-1">
        <p className="font-serif text-xl font-semibold text-ink">{title}</p>
        {description ? <p className="text-sm text-stone-ink">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <h2 className="font-serif text-[1.75rem] leading-tight font-medium text-ink sm:text-[2.1rem]">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function DemoNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-stone-ink", className)}>
      Dados de demonstração — somem quando o catálogo real for ativado.
    </p>
  );
}
