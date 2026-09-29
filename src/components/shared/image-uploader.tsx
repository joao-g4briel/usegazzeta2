"use client";

import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; altText?: string | null };

export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Falha no envio da imagem.");
  return data.url;
}

export function ImageUploader({
  value,
  onChange,
  max = 12,
}: {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, Math.max(0, max - value.length));
    if (!list.length) {
      toast.error(`Limite de ${max} imagens.`);
      return;
    }
    setUploading((n) => n + list.length);
    const added: UploadedImage[] = [];
    for (const file of list) {
      try {
        added.push({ url: await uploadImage(file) });
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (added.length) onChange([...value, ...added]);
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...value];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-olive bg-sage-mist" : "border-[#d6ccbb] bg-offwhite hover:border-sage",
        )}
      >
        {uploading ? <Loader2 className="size-6 animate-spin text-olive" /> : <Upload className="size-6 text-olive" />}
        <span className="text-sm font-semibold text-ink">
          {uploading ? `Enviando ${uploading} ${uploading === 1 ? "imagem" : "imagens"}…` : "Clique para enviar imagens"}
        </span>
        <span className="text-xs text-stone-ink">ou arraste e solte aqui · JPG, PNG ou WEBP · máx. 5 MB</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {value.length ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((img, i) => (
            <li key={img.url} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-linen">
              <Image src={img.url} alt={img.altText ?? ""} fill sizes="160px" className="object-cover" />
              {i === 0 ? (
                <span className="absolute bottom-2 left-2 rounded-full bg-olive px-2 py-0.5 text-[0.65rem] font-bold text-offwhite">
                  Principal
                </span>
              ) : null}
              <div className="absolute inset-x-1.5 top-1.5 flex justify-between opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                <div className="flex gap-1">
                  <button type="button" aria-label="Mover para a esquerda" onClick={() => move(i, -1)} disabled={i === 0} className="inline-flex size-7 items-center justify-center rounded-full bg-paper/95 disabled:opacity-40">
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button type="button" aria-label="Mover para a direita" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="inline-flex size-7 items-center justify-center rounded-full bg-paper/95 disabled:opacity-40">
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Remover imagem"
                  onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                  className="inline-flex size-7 items-center justify-center rounded-full bg-paper/95"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
          {value.length < max ? (
            <li>
              <button
                type="button"
                onClick={() => input.current?.click()}
                aria-label="Adicionar imagem"
                className="flex aspect-[4/5] w-full items-center justify-center rounded-xl border border-dashed border-[#d6ccbb] text-stone-ink hover:border-sage hover:text-olive"
              >
                <ImagePlus className="size-6" />
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
