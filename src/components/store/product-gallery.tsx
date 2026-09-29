"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/shared/product-image";
import type { ProductImageDTO } from "@/types/catalog";
import type { VariantKind } from "@/lib/constants";

export function ProductGallery({
  images,
  name,
  kind,
  tint,
}: {
  images: ProductImageDTO[];
  name: string;
  kind: VariantKind;
  tint: string | null;
}) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    return (
      <ProductImage
        src={null}
        alt={name}
        kind={kind}
        tint={tint}
        priority
        className="aspect-[4/5] w-full rounded-[2rem]"
        artClassName="h-[62%]"
      />
    );
  }
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-linen">
        <Image
          key={current.id}
          src={current.url}
          alt={current.altText ?? name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="animate-pop-in object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto lg:w-20 lg:shrink-0 lg:flex-col">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagem ${i + 1} de ${images.length}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl ring-offset-2 ring-offset-offwhite transition lg:w-full",
                i === active ? "ring-2 ring-olive" : "opacity-70 hover:opacity-100",
              )}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
