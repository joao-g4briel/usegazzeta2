import Image from "next/image";
import { cn } from "@/lib/utils";
import type { VariantKind } from "@/lib/constants";
import { KIND_FIELDS, ProductArt } from "@/components/shared/product-art";
import { Monogram } from "@/components/shared/wordmark";

// Foto do produto ou, sem foto, um campo tingido com o desenho da categoria.
export function ProductImage({
  src,
  alt,
  kind,
  tint,
  className,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority,
  monogram = true,
  artClassName,
}: {
  src?: string | null;
  alt: string;
  kind: VariantKind;
  tint?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  monogram?: boolean;
  artClassName?: string;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-linen", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        KIND_FIELDS[kind],
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-[7%] rounded-[inherit] border border-white/55" />
      <ProductArt kind={kind} tint={tint} hint={alt} className={cn("h-[72%] w-auto drop-shadow-[0_8px_18px_rgb(95_115_91/0.12)]", artClassName)} />
      {monogram ? (
        <Monogram className="absolute right-[9%] bottom-[7%] text-[0.95rem] opacity-40" />
      ) : null}
    </div>
  );
}
