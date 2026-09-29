import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gem, ShieldCheck, Sparkle, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { swatchFor } from "@/lib/constants";
import { ProductImage } from "@/components/shared/product-image";
import type { StoreProductCard } from "@/types/catalog";

export const BENEFITS = [
  { icon: Gem, title: "Peças a partir de R$10" },
  { icon: Truck, title: "Enviamos para todo o Brasil" },
  { icon: ShieldCheck, title: "Compra segura e facilitada" },
];

// Vitrine em arcos: cada arco é uma peça real do catálogo com a etiqueta de preço pendurada.
function Arch({
  product,
  photo,
  className,
  delay,
  tall,
}: {
  product: StoreProductCard;
  photo?: string | null;
  className?: string;
  delay: number;
  tall?: boolean;
}) {
  const tint = product.swatches[0] ? swatchFor(product.swatches[0].color, product.swatches[0].hex) : null;
  return (
    <Link
      href={`/produtos/${product.slug}`}
      className={cn("group/arch relative block outline-none", className)}
      aria-label={`${product.name}, ${formatBRL(product.price)}`}
    >
      <div
        className="animate-arch-rise overflow-hidden rounded-t-full rounded-b-[1.75rem] shadow-lift ring-1 ring-white/60 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/arch:-translate-y-1.5 group-focus-visible/arch:-translate-y-1.5"
        style={{ animationDelay: `${delay}ms` }}
      >
        {photo ? (
          <div className={cn("relative w-full", tall ? "aspect-[3/5]" : "aspect-[3/4.6]")}>
            <Image src={photo} alt={product.name} fill priority sizes="(max-width: 1024px) 33vw, 20vw" className="object-cover" />
          </div>
        ) : (
          <ProductImage
            src={product.image}
            alt={product.name}
            kind={product.variantKind}
            tint={tint}
            priority
            monogram={false}
            sizes="(max-width: 1024px) 33vw, 20vw"
            className={cn("w-full", tall ? "aspect-[3/5]" : "aspect-[3/4.6]")}
            artClassName="h-[58%]"
          />
        )}
      </div>
      {/* etiqueta pendurada por um fio dourado */}
      <div
        className="absolute -bottom-5 left-[12%] origin-top -rotate-[5deg] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/arch:rotate-[3deg] group-focus-visible/arch:rotate-[3deg] max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:-bottom-7"
      >
        <span aria-hidden className="absolute -top-5 left-6 h-5 w-px bg-gold max-sm:left-1/2" />
        <span className="flex min-w-[8.5rem] flex-col rounded-lg border border-hairline bg-paper px-3 py-2 shadow-soft max-sm:min-w-[6.2rem] max-sm:px-2 max-sm:py-1.5">
          <span aria-hidden className="absolute -top-1 left-[1.3rem] size-2 rounded-full border border-gold bg-offwhite max-sm:left-[calc(50%-0.25rem)]" />
          <span className="truncate text-[0.72rem] leading-tight text-stone-ink max-sm:text-[0.62rem]">{product.name}</span>
          <span className="text-[0.95rem] font-bold text-ink tabular max-sm:text-[0.78rem]">{formatBRL(product.price)}</span>
        </span>
      </div>
    </Link>
  );
}

export function Hero({
  trio,
  heroImageUrl,
}: {
  trio: StoreProductCard[];
  heroImageUrl: string | null;
}) {
  const [left, center, right] = trio;
  return (
    <section className="relative overflow-hidden bg-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-12%] size-[42rem] rounded-full bg-sage-light/60 blur-[2px] max-lg:hidden"
      />
      <div className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[1.02fr_1fr] lg:gap-6 lg:pt-14 lg:pb-20">
        <div className="max-w-[38rem] animate-pop-in">
          <h1 className="font-serif text-[2.9rem] leading-[0.98] font-medium tracking-[-0.015em] text-ink sm:text-[4rem] lg:text-[4.6rem]">
            Moda, make & perfume
            <span className="block">
              para você{" "}
              <span className="relative inline-block font-script text-[1.32em] leading-none font-normal tracking-normal text-gold-ink">
                brilhar
                <Sparkle
                  aria-hidden
                  className="absolute -top-[0.05em] -right-[0.45em] size-[0.32em] fill-gold text-gold"
                  strokeWidth={1}
                />
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-[31rem] text-[1.05rem] leading-relaxed text-stone-ink sm:text-lg">
            Peças que valorizam o seu estilo, makes que realçam sua beleza e perfumes que deixam sua marca.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/produtos"
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-olive px-8 text-[0.92rem] font-bold tracking-[0.14em] text-offwhite uppercase shadow-[0_14px_30px_-16px_rgb(74_91_71/0.9)] transition-colors hover:bg-olive-deep"
            >
              Comprar agora
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/produtos?filtro=novidades" className="text-sm font-semibold text-olive underline-offset-4 hover:underline">
              Ver novidades
            </Link>
          </div>
          <ul className="mt-10 grid max-w-[34rem] grid-cols-3 gap-3 border-t border-[#e2d8c8] pt-6">
            {BENEFITS.map(({ icon: Icon, title }) => (
              <li key={title} className="flex flex-col gap-2 text-[0.82rem] leading-snug text-ink sm:flex-row sm:items-center">
                <Icon className="size-5 shrink-0 text-gold-ink" strokeWidth={1.4} />
                {title}
              </li>
            ))}
          </ul>
        </div>

        {center ? (
          <div className="relative mx-auto grid w-full max-w-[36rem] grid-cols-3 items-end gap-3 pb-8 sm:gap-5 lg:max-w-none lg:pr-4">
            {left ? <Arch product={left} delay={120} className="translate-y-6" /> : <span />}
            <Arch product={center} photo={heroImageUrl} delay={0} tall />
            {right ? <Arch product={right} delay={240} className="translate-y-10" /> : <span />}
          </div>
        ) : null}
      </div>
    </section>
  );
}
