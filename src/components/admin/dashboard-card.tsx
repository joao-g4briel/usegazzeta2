import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Contrato de stat tile: rótulo · valor (sans, algarismos proporcionais) · variação vs período nomeado.
export function DashboardCard({
  label,
  value,
  icon: Icon,
  tone = "sage",
  delta,
  deltaLabel,
  note,
  upIsGood = true,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "sage" | "beige" | "rose" | "gold";
  delta?: number | null;
  deltaLabel?: string;
  note?: string;
  upIsGood?: boolean;
}) {
  const iconTone = {
    sage: "bg-sage-light text-olive",
    beige: "bg-[#efe4d4] text-gold-ink",
    rose: "bg-rose-mist text-rose-deep",
    gold: "bg-gold-mist text-gold-ink",
  }[tone];
  const hasDelta = delta !== undefined && delta !== null;
  const good = hasDelta && (upIsGood ? delta >= 0 : delta <= 0);
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-hairline bg-paper p-4 shadow-soft sm:gap-4 sm:p-5">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full sm:size-10", iconTone)}>
          <Icon className="size-4 sm:size-[1.15rem]" strokeWidth={1.8} />
        </span>
        <span className="text-[0.8rem] leading-tight font-medium text-stone-ink sm:text-sm">{label}</span>
      </div>
      <p className="truncate text-[1.4rem] leading-none font-semibold tracking-[-0.01em] text-ink sm:text-[1.9rem]">{value}</p>
      <p className="flex flex-wrap items-center gap-x-1.5 text-[0.7rem] leading-snug text-stone-ink sm:text-xs">
        {hasDelta ? (
          <span className={cn("inline-flex items-center gap-0.5 font-bold", good ? "text-[#2f6a3f]" : "text-rose-deep")}>
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {delta > 0 ? "+" : ""}
            {delta.toLocaleString("pt-BR")}%
          </span>
        ) : null}
        {deltaLabel ? <span>{deltaLabel}</span> : null}
        {note ? <span>{note}</span> : null}
      </p>
    </div>
  );
}
