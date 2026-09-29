import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
  optional,
}: {
  label: ReactNode;
  htmlFor?: string;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-ink">
        {label}
        {optional ? <span className="ml-1 font-normal text-stone-ink">(opcional)</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-stone-ink">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-hairline bg-paper p-5 sm:p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-stone-ink">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// Máscaras simples de digitação (o servidor sempre revalida).
export function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCep(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function maskCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
