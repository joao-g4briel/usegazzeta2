"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Barcode, Camera, Check, Loader2, Sparkle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { cn } from "@/lib/utils";
import { APPAREL_SIZES, FRAGRANCE_VOLUMES, swatchFor, type VariantKind } from "@/lib/constants";
import { formatBRL } from "@/lib/money";
import { quickRegisterAction, searchProductsByNameAction } from "@/actions/product-actions";
import { uploadImage } from "@/components/shared/image-uploader";
import type { ProductNameMatch } from "@/services/product-service";
import type { CategoryDTO, PosVariant } from "@/types/catalog";

const QUICK_COLORS = ["Amarelo", "Rosa", "Verde", "Preto", "Branco", "Bege", "Vermelho", "Vinho", "Lilás", "Nude"];

function Chips({ options, value, onChange, swatches }: { options: readonly string[]; value: string; onChange: (v: string) => void; swatches?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(value === o ? "" : o)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium",
            value === o ? "border-olive bg-olive text-offwhite" : "border-hairline bg-paper text-ink",
          )}
        >
          {swatches ? <span className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: swatchFor(o) ?? "#ddd" }} /> : null}
          {o}
        </button>
      ))}
    </div>
  );
}

export function QuickRegisterForm({
  barcode,
  categories,
  addToCart,
  onDone,
  onCancel,
}: {
  barcode: string;
  categories: CategoryDTO[];
  addToCart: boolean;
  onDone: (variant: PosVariant, info: { createdProduct: boolean }) => void;
  onCancel: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [existing, setExisting] = useState<ProductNameMatch | null>(null);
  const [matches, setMatches] = useState<ProductNameMatch[]>([]);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [tone, setTone] = useState("");
  const [volume, setVolume] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [minimum, setMinimum] = useState("1");
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const category = categories.find((c) => c.id === categoryId);
  const kind: VariantKind = category?.variantKind ?? "OTHER";

  useEffect(() => {
    if (existing || name.trim().length < 3) return;
    const t = setTimeout(async () => {
      const r = await searchProductsByNameAction(name, categoryId);
      if (r.ok) setMatches(r.data);
    }, 280);
    return () => clearTimeout(t);
  }, [name, categoryId, existing]);

  function pickExisting(m: ProductNameMatch) {
    setExisting(m);
    setName(m.name);
    setCategoryId(m.categoryId);
    setMatches([]);
    if (m.suggestedPrice) setPrice(m.suggestedPrice.toFixed(2).replace(".", ","));
    if (m.suggestedCost) setCost(m.suggestedCost.toFixed(2).replace(".", ","));
    if (m.suggestedMinimum !== null) setMinimum(String(m.suggestedMinimum));
  }

  async function onPhoto(file: File) {
    setUploading(true);
    try {
      setPhoto(await uploadImage(file));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!categoryId) return;
    setErrors({});
    start(async () => {
      const result = await quickRegisterAction({
        barcode,
        existingProductId: existing?.id ?? null,
        name,
        categoryId,
        color: color || null,
        size: size || null,
        tone: tone || null,
        volume: volume || null,
        costPrice: cost || "0",
        salePrice: price,
        initialStock: stock,
        minimumStock: minimum,
        imageUrl: photo,
        addToCart,
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      onDone(result.data.variant, { createdProduct: result.data.createdProduct });
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-serif text-[1.9rem] leading-tight font-medium">Cadastrar produto</h2>
        <span className="inline-flex items-center gap-1.5 font-serif text-lg whitespace-nowrap text-stone-ink italic">
          <Sparkle className="size-4 fill-gold text-gold" /> Cadastro rápido
        </span>
      </div>

      <Field label="Código de barras" htmlFor="qr-barcode">
        <div className="flex h-12 items-center rounded-xl border border-input bg-linen/60 px-4">
          <span id="qr-barcode" className="flex-1 text-lg tracking-wide tabular">{barcode}</span>
          <Barcode className="size-6 text-stone-ink" />
        </div>
      </Field>

      {!categoryId ? (
        <div>
          <p className="mb-2 text-sm font-medium">Qual categoria?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className="h-14 rounded-2xl border border-hairline bg-paper text-base font-semibold hover:border-olive hover:bg-sage-mist"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-stone-ink">Categoria</span>
            <span className="inline-flex h-8 items-center gap-2 rounded-full bg-sage-light pr-1.5 pl-3 text-sm font-semibold text-secondary-foreground">
              {category?.name}
              {!existing ? (
                <button type="button" aria-label="Trocar categoria" onClick={() => setCategoryId(null)} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-white/60">
                  <X className="size-3.5" />
                </button>
              ) : null}
            </span>
          </div>

          <Field label="Nome do produto" htmlFor="qr-name" error={errors.name}>
            {existing ? (
              <div className="flex items-center gap-2 rounded-xl border border-olive bg-sage-mist px-3 py-2.5">
                <Check className="size-4 text-olive" />
                <span className="flex-1 text-sm">
                  Nova variante de <strong>{existing.name}</strong>
                  <span className="block text-xs text-stone-ink">Já existem: {existing.variants.join(", ") || "Padrão"}</span>
                </span>
                <button type="button" onClick={() => { setExisting(null); setName(""); }} className="text-xs font-semibold text-olive">
                  Trocar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input id="qr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Perfume Lancôme La Vie Est Belle" className="h-12" autoComplete="off" />
                {matches.length ? (
                  <ul className="absolute inset-x-0 top-[calc(100%+0.3rem)] z-10 rounded-xl border border-hairline bg-paper p-1 shadow-lift">
                    <li className="px-3 py-1.5 text-xs font-semibold text-stone-ink">Já cadastrado — adicionar como nova variante?</li>
                    {matches.map((m) => (
                      <li key={m.id}>
                        <button type="button" onClick={() => pickExisting(m)} className="w-full rounded-lg px-3 py-2 text-left hover:bg-linen">
                          <span className="block text-sm font-semibold">{m.name}</span>
                          <span className="block text-xs text-stone-ink">
                            {m.categoryName} · {m.variants.slice(0, 4).join(", ")}
                            {m.suggestedPrice ? ` · ${formatBRL(m.suggestedPrice)}` : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </Field>

          {kind === "APPAREL" || kind === "ACCESSORY" ? (
            <Field label="Cor" htmlFor="qr-color">
              <Chips options={QUICK_COLORS} value={color} onChange={setColor} swatches />
              <Input id="qr-color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Outra cor" className="mt-1.5" />
            </Field>
          ) : null}
          {kind === "APPAREL" ? (
            <Field label="Tamanho" htmlFor="qr-size">
              <Chips options={APPAREL_SIZES} value={size} onChange={setSize} />
            </Field>
          ) : null}
          {kind === "BEAUTY" ? (
            <Field label="Tom / cor / número" htmlFor="qr-tone">
              <Input id="qr-tone" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Ex.: Nude 01" />
            </Field>
          ) : null}
          {kind === "FRAGRANCE" || kind === "BEAUTY" ? (
            <Field label="Volume" htmlFor="qr-volume" optional={kind === "BEAUTY"}>
              <Chips options={FRAGRANCE_VOLUMES} value={volume} onChange={setVolume} />
            </Field>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço de custo (R$)" htmlFor="qr-cost" error={errors.costPrice}>
              <Input id="qr-cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0,00" className="h-12 text-base" />
            </Field>
            <Field label="Preço de venda (R$)" htmlFor="qr-price" error={errors.salePrice}>
              <Input id="qr-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" className="h-12 text-base" aria-invalid={!!errors.salePrice} />
            </Field>
            <Field label="Estoque inicial" htmlFor="qr-stock" error={errors.initialStock}>
              <Input id="qr-stock" type="number" min={0} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className="h-12 text-base" />
            </Field>
            <Field label="Estoque mínimo" htmlFor="qr-min" error={errors.minimumStock}>
              <Input id="qr-min" type="number" min={0} inputMode="numeric" value={minimum} onChange={(e) => setMinimum(e.target.value)} className="h-12 text-base" />
            </Field>
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPhoto(f);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : photo ? <Check /> : <Camera />}
              {photo ? "Foto adicionada — trocar" : "Tirar foto do produto (opcional)"}
            </Button>
          </div>
        </>
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
        <Button type="button" variant="outline" size="xl" onClick={onCancel} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button type="button" size="xl" className="w-full sm:flex-1" disabled={!categoryId || pending || !price} onClick={submit}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {addToCart ? "Cadastrar e adicionar" : "Cadastrar produto"}
        </Button>
      </div>
    </div>
  );
}
