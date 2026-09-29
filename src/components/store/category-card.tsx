import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VariantKind } from "@/lib/constants";
import { ProductArt } from "@/components/shared/product-art";

const FIELD: Record<string, string> = {
  roupas: "bg-sage-light",
  maquiagens: "bg-rose-mist",
  perfumes: "bg-[#efe4d4]",
};

export function CategoryCard({
  slug,
  name,
  tagline,
  cta,
  kind,
  tint,
}: {
  slug: string;
  name: string;
  tagline: string;
  cta: string;
  kind: VariantKind;
  tint?: string;
}) {
  return (
    <Link
      href={`/categoria/${slug}`}
      className={cn(
        "group relative flex min-h-[11.5rem] items-stretch overflow-hidden rounded-3xl p-6 transition-shadow duration-300 hover:shadow-lift sm:min-h-[13.5rem] sm:p-7",
        FIELD[slug] ?? "bg-linen",
      )}
    >
      <div className="relative z-10 flex max-w-[60%] flex-col">
        <h3 className="font-serif text-[2rem] leading-none font-medium text-ink sm:text-[2.35rem]">{name}</h3>
        <p className="mt-2 text-[0.95rem] leading-snug text-stone-ink">{tagline}</p>
        <span className="mt-auto inline-flex h-10 w-fit items-center gap-2 rounded-full bg-olive px-5 text-[0.72rem] font-bold tracking-[0.12em] text-offwhite uppercase transition-colors group-hover:bg-olive-deep">
          {cta}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <ProductArt
        kind={kind}
        tint={tint}
        className="absolute right-[-2%] bottom-[-8%] h-[118%] w-auto transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:rotate-[-2deg]"
      />
    </Link>
  );
}
