import { cn } from "@/lib/utils";

// Assinatura tipográfica da marca. Quando o logo oficial estiver disponível,
// basta trocar este componente por <Image src="/logo/..." />.
export function Wordmark({
  className,
  tone = "ink",
  size = "md",
  subtitle,
}: {
  className?: string;
  tone?: "ink" | "light" | "olive";
  size?: "sm" | "md" | "lg";
  subtitle?: string;
}) {
  const color =
    tone === "light" ? "text-offwhite" : tone === "olive" ? "text-olive" : "text-ink";
  const main = size === "lg" ? "text-[2.35rem]" : size === "sm" ? "text-[1.35rem]" : "text-[1.8rem]";
  const small = size === "lg" ? "text-[0.95rem]" : size === "sm" ? "text-[0.62rem]" : "text-[0.78rem]";
  return (
    <span className={cn("inline-flex flex-col leading-none", color, className)}>
      <span className="inline-flex items-baseline gap-[0.45em]">
        <span className={cn("font-sans font-medium tracking-[0.28em]", small)}>USE</span>
        <span className={cn("font-serif font-medium uppercase tracking-[0.09em]", main)}>Gazzeta</span>
      </span>
      {subtitle ? (
        <span className="mt-1 font-sans text-[0.72rem] font-medium tracking-[0.08em] opacity-90">
          {subtitle}
        </span>
      ) : null}
    </span>
  );
}

// Monograma "UG" entrelaçado, em tipografia (sem imitar o desenho do logo oficial).
export function Monogram({ className, tone = "olive" }: { className?: string; tone?: "olive" | "light" | "gold" }) {
  const color = tone === "light" ? "text-offwhite" : tone === "gold" ? "text-gold-ink" : "text-olive";
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex font-serif font-light leading-none select-none", color, className)}
    >
      <span>U</span>
      <span className="-ml-[0.34em] translate-y-[0.08em]">G</span>
    </span>
  );
}
