"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { History, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BADGE_LABELS, VARIANT_KIND_LABELS, swatchFor } from "@/lib/constants";
import { variantLabel } from "@/lib/variant";
import { PRODUCT_BADGES, productInputSchema, type ProductFormValues } from "@/lib/validations/product";
import { checkBarcodeAction, saveProductAction } from "@/actions/product-actions";
import { Field } from "@/components/shared/field";
import { ImageUploader } from "@/components/shared/image-uploader";
import { ScanButton } from "@/components/shared/scan-dialog";
import { VariantGenerator, type GeneratedVariant } from "@/components/admin/variant-generator";
import type { CategoryDTO, ProductEditDTO } from "@/types/catalog";

const money = (n: number | null | undefined) => (n === null || n === undefined ? "" : n.toFixed(2).replace(".", ","));

type VariantRow = NonNullable<ProductFormValues["variants"]>[number];

function blankVariant(attrs: GeneratedVariant, defaults: { price: string; cost: string; min: string }): VariantRow {
  return {
    id: null,
    sku: "",
    barcode: "",
    color: attrs.color,
    colorHex: null,
    size: attrs.size,
    tone: attrs.tone,
    volume: attrs.volume,
    costPrice: defaults.cost,
    salePrice: defaults.price,
    promotionalPrice: "",
    stock: 0,
    minimumStock: defaults.min,
    active: true,
  };
}

function toFormValues(product: ProductEditDTO | null, categories: CategoryDTO[]): ProductFormValues {
  if (!product) {
    return {
      name: "",
      categoryId: categories[0]?.id ?? "",
      description: "",
      brand: "",
      basePrice: "",
      active: true,
      featured: false,
      newProduct: true,
      onSale: false,
      badge: null,
      seoTitle: "",
      seoDescription: "",
      images: [],
      variants: [],
    };
  }
  return {
    name: product.name,
    categoryId: product.categoryId,
    description: product.description ?? "",
    brand: product.brand ?? "",
    basePrice: money(product.basePrice),
    active: product.active,
    featured: product.featured,
    newProduct: product.newProduct,
    onSale: product.onSale,
    badge: product.badge,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    images: product.images.map((i) => ({ url: i.url, altText: i.altText })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode ?? "",
      color: v.color,
      colorHex: v.colorHex,
      size: v.size,
      tone: v.tone,
      volume: v.volume,
      costPrice: money(v.costPrice),
      salePrice: money(v.salePrice),
      promotionalPrice: money(v.promotionalPrice),
      stock: v.stock,
      minimumStock: v.minimumStock,
      active: v.active,
    })),
  };
}

const TAB_FIELDS: Record<string, (keyof ProductFormValues)[]> = {
  info: ["name", "categoryId", "description", "brand", "basePrice", "badge"],
  variants: ["variants"],
  media: ["images"],
  seo: ["seoTitle", "seoDescription"],
};

function tabHasError(tab: string, errors: FieldErrors<ProductFormValues>) {
  return TAB_FIELDS[tab].some((f) => errors[f]);
}

export function ProductForm({
  product,
  categories,
}: {
  product: ProductEditDTO | null;
  categories: CategoryDTO[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState("info");
  const [pending, startTransition] = useTransition();
  const [defaults, setDefaults] = useState({ price: money(product?.basePrice ?? null), cost: "", min: "2" });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productInputSchema),
    defaultValues: toFormValues(product, categories),
    mode: "onBlur",
  });
  const { register, control, handleSubmit, formState, setValue, setError, clearErrors } = form;
  const errors = formState.errors;
  const variants = useFieldArray({ control, name: "variants" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const images = useWatch({ control, name: "images" }) ?? [];
  const name = useWatch({ control, name: "name" });
  const seoTitle = useWatch({ control, name: "seoTitle" });
  const seoDescription = useWatch({ control, name: "seoDescription" });
  const watchedVariants = useWatch({ control, name: "variants" });
  const variantValues = useMemo(() => watchedVariants ?? [], [watchedVariants]);
  const category = categories.find((c) => c.id === categoryId);
  const kind = category?.variantKind ?? "OTHER";

  const totalStock = useMemo(
    () => variantValues.reduce((s, v) => s + (v?.active === false ? 0 : Number(v?.stock) || 0), 0),
    [variantValues],
  );

  function addGenerated(rows: GeneratedVariant[]) {
    const base = { price: defaults.price || money(null), cost: defaults.cost || "0", min: defaults.min || "1" };
    variants.append(rows.map((r) => blankVariant(r, base)));
    toast.success(`${rows.length} ${rows.length === 1 ? "variante gerada" : "variantes geradas"}`);
  }

  function addStandard() {
    variants.append(
      blankVariant(
        { color: null, size: null, tone: null, volume: null },
        { price: defaults.price, cost: defaults.cost || "0", min: defaults.min || "1" },
      ),
    );
  }

  async function verifyBarcode(index: number, value: string) {
    if (!value.trim()) return;
    const id = variantValues[index]?.id ?? undefined;
    const result = await checkBarcodeAction(value, id ?? undefined);
    if (result.ok && !result.data.available) {
      setError(`variants.${index}.barcode`, { message: result.data.message ?? "Código indisponível." });
    }
  }

  const onSubmit = handleSubmit(
    (values) => {
      startTransition(async () => {
        const result = await saveProductAction(values, product?.id);
        if (!result.ok) {
          toast.error(result.error);
          if (result.code === "DUPLICATE_BARCODE") setTab("variants");
          return;
        }
        toast.success(result.message ?? "Produto salvo");
        if (!product) router.push(`/admin/produtos/${result.data.id}`);
        else router.refresh();
      });
    },
    (errs) => {
      const firstTab = Object.keys(TAB_FIELDS).find((t) => tabHasError(t, errs));
      if (firstTab) setTab(firstTab);
      toast.error("Confira os campos destacados.");
    },
  );

  const tabs = [
    { value: "info", label: "Informações" },
    { value: "variants", label: `Variações (${variants.fields.length})` },
    { value: "media", label: "Mídia" },
    { value: "seo", label: "SEO" },
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="pb-24">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="no-scrollbar mb-5 h-12 w-full justify-start overflow-x-auto rounded-2xl bg-linen p-1 sm:w-auto">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="relative h-10 rounded-xl px-4 text-sm font-semibold data-[state=active]:bg-olive data-[state=active]:text-offwhite"
            >
              {t.label}
              {tabHasError(t.value, errors) ? (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive" aria-label="com erro" />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── Informações ─── */}
        <TabsContent value="info" className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="space-y-5 rounded-2xl border border-hairline bg-paper p-5 sm:p-6">
            <h2 className="text-base font-semibold">Informações básicas</h2>
            <Field label="Nome do produto" htmlFor="name" error={errors.name?.message}>
              <Input id="name" placeholder="Ex.: Vestido Frente Única" {...register("name")} aria-invalid={!!errors.name} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria" htmlFor="categoryId" error={errors.categoryId?.message} hint={category ? `Variações por ${VARIANT_KIND_LABELS[kind].toLowerCase()}` : undefined}>
                <select id="categoryId" {...register("categoryId")} className="h-10 w-full rounded-xl border border-input bg-paper px-3 text-sm">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Marca" htmlFor="brand" optional>
                <Input id="brand" {...register("brand")} />
              </Field>
            </div>
            <Field label="Descrição" htmlFor="description" optional>
              <Textarea id="description" rows={5} {...register("description")} className="rounded-xl bg-paper" />
            </Field>
            <Field label="Preço base (R$)" htmlFor="basePrice" optional hint="Referência para gerar as variantes; o preço vendido é o da variante." error={errors.basePrice?.message}>
              <Input
                id="basePrice"
                inputMode="decimal"
                placeholder="0,00"
                {...register("basePrice", { onChange: (e) => setDefaults((d) => ({ ...d, price: e.target.value })) })}
                className="sm:max-w-48"
              />
            </Field>
          </section>
          <section className="space-y-4 rounded-2xl border border-hairline bg-paper p-5 sm:p-6">
            <h2 className="text-base font-semibold">Vitrine</h2>
            {(
              [
                ["active", "Produto ativo", "Aparece na loja e no PDV."],
                ["featured", "Produto em destaque", "Entra nos destaques da página inicial."],
                ["newProduct", "Produto novo", "Selo de novidade na loja."],
                ["onSale", "Produto em promoção", "Aparece em Ofertas."],
              ] as const
            ).map(([field, label, hint]) => (
              <Controller
                key={field}
                control={control}
                name={field}
                render={({ field: f }) => (
                  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl bg-offwhite px-4 py-3">
                    <span>
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block text-xs text-stone-ink">{hint}</span>
                    </span>
                    <Switch checked={Boolean(f.value)} onCheckedChange={f.onChange} />
                  </label>
                )}
              />
            ))}
            <Field label="Selo na vitrine" htmlFor="badge" optional hint="Sem selo manual, a loja usa Novidade, Oferta ou Últimas peças automaticamente.">
              <Controller
                control={control}
                name="badge"
                render={({ field }) => (
                  <select
                    id="badge"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    className="h-10 w-full rounded-xl border border-input bg-paper px-3 text-sm"
                  >
                    <option value="">Automático</option>
                    {PRODUCT_BADGES.map((b) => (
                      <option key={b} value={b}>
                        {BADGE_LABELS[b]}
                      </option>
                    ))}
                  </select>
                )}
              />
            </Field>
          </section>
        </TabsContent>

        {/* ─── Variações ─── */}
        <TabsContent value="variants" className="space-y-5">
          <section className="space-y-5 rounded-2xl border border-hairline bg-paper p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Gerar variações</h2>
                <p className="text-sm text-stone-ink">
                  {category?.name ?? "Categoria"} · {VARIANT_KIND_LABELS[kind]}. Cada variante é o item vendido, com SKU,
                  código de barras e estoque próprios.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input aria-label="Preço padrão" placeholder="Preço" inputMode="decimal" value={defaults.price} onChange={(e) => setDefaults((d) => ({ ...d, price: e.target.value }))} className="h-9 w-24" />
                <Input aria-label="Custo padrão" placeholder="Custo" inputMode="decimal" value={defaults.cost} onChange={(e) => setDefaults((d) => ({ ...d, cost: e.target.value }))} className="h-9 w-24" />
                <Input aria-label="Estoque mínimo padrão" placeholder="Mín." inputMode="numeric" value={defaults.min} onChange={(e) => setDefaults((d) => ({ ...d, min: e.target.value }))} className="h-9 w-20" />
              </div>
            </div>
            <VariantGenerator kind={kind} existing={variantValues.map((v) => ({ color: v?.color ?? null, size: v?.size ?? null, tone: v?.tone ?? null, volume: v?.volume ?? null }))} onGenerate={addGenerated} />
          </section>

          <section className="rounded-2xl border border-hairline bg-paper p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Variantes</h2>
                <p className="text-sm text-stone-ink">
                  Estoque total calculado: <strong className="text-ink tabular">{totalStock}</strong> unidades
                  {product ? " · alterar o estoque aqui gera um ajuste registrado" : ""}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addStandard}>
                <Plus /> {variants.fields.length ? "Adicionar variante" : "Variante padrão"}
              </Button>
            </div>
            {errors.variants?.message || errors.variants?.root?.message ? (
              <p className="mb-3 rounded-xl bg-rose-mist px-4 py-2.5 text-sm font-medium text-rose-deep">
                {errors.variants?.message ?? errors.variants?.root?.message}
              </p>
            ) : null}
            {variants.fields.length ? (
              <div className="space-y-3">
                {variants.fields.map((field, index) => {
                  const v = variantValues[index];
                  const rowErrors = errors.variants?.[index];
                  const label = variantLabel(v ?? {});
                  const swatch = swatchFor(v?.color, v?.colorHex);
                  return (
                    <div key={field.id} className={cn("rounded-2xl border border-hairline p-4", v?.active === false && "opacity-60")}>
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        {swatch ? <span className="size-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: swatch }} /> : null}
                        <p className="font-semibold">{label}</p>
                        {v?.id ? (
                          <Link href={`/admin/estoque/movimentacoes?variante=${v.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-olive hover:underline">
                            <History className="size-3.5" /> Histórico
                          </Link>
                        ) : (
                          <span className="rounded-full bg-sage-light px-2 py-0.5 text-[0.68rem] font-bold text-secondary-foreground">nova</span>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                          <Controller
                            control={control}
                            name={`variants.${index}.active`}
                            render={({ field: f }) => (
                              <label className="flex items-center gap-2 text-xs font-medium text-stone-ink">
                                Ativa <Switch checked={f.value !== false} onCheckedChange={f.onChange} />
                              </label>
                            )}
                          />
                          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover variante ${label}`} onClick={() => variants.remove(index)}>
                            <Trash2 className="text-stone-ink" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                        {kind === "APPAREL" || kind === "ACCESSORY" || (!v?.tone && !v?.volume && kind !== "FRAGRANCE" && kind !== "BEAUTY") ? (
                          <Field label="Cor" htmlFor={`v${index}-color`} error={rowErrors?.color?.message}>
                            <Input id={`v${index}-color`} {...register(`variants.${index}.color`)} />
                          </Field>
                        ) : null}
                        {kind === "APPAREL" ? (
                          <Field label="Tamanho" htmlFor={`v${index}-size`}>
                            <Input id={`v${index}-size`} {...register(`variants.${index}.size`)} />
                          </Field>
                        ) : null}
                        {kind === "BEAUTY" ? (
                          <Field label="Tom" htmlFor={`v${index}-tone`} error={rowErrors?.color?.message}>
                            <Input id={`v${index}-tone`} {...register(`variants.${index}.tone`)} />
                          </Field>
                        ) : null}
                        {kind === "FRAGRANCE" || kind === "BEAUTY" ? (
                          <Field label="Volume" htmlFor={`v${index}-volume`} error={kind === "FRAGRANCE" ? rowErrors?.color?.message : undefined}>
                            <Input id={`v${index}-volume`} {...register(`variants.${index}.volume`)} />
                          </Field>
                        ) : null}
                        <Field label="SKU" htmlFor={`v${index}-sku`} error={rowErrors?.sku?.message}>
                          <Input id={`v${index}-sku`} placeholder="automático" {...register(`variants.${index}.sku`)} className="uppercase placeholder:normal-case" />
                        </Field>
                        <Field label="Código de barras" htmlFor={`v${index}-barcode`} error={rowErrors?.barcode?.message} className="col-span-2">
                          <div className="flex gap-1.5">
                            <Input
                              id={`v${index}-barcode`}
                              inputMode="numeric"
                              className="tabular"
                              aria-invalid={!!rowErrors?.barcode}
                              {...register(`variants.${index}.barcode`, {
                                onBlur: (e) => verifyBarcode(index, e.target.value),
                                onChange: () => clearErrors(`variants.${index}.barcode`),
                              })}
                            />
                            <ScanButton
                              onCode={(code) => {
                                setValue(`variants.${index}.barcode`, code, { shouldDirty: true });
                                clearErrors(`variants.${index}.barcode`);
                                verifyBarcode(index, code);
                              }}
                            />
                          </div>
                        </Field>
                        <Field label="Custo (R$)" htmlFor={`v${index}-cost`} error={rowErrors?.costPrice?.message}>
                          <Input id={`v${index}-cost`} inputMode="decimal" {...register(`variants.${index}.costPrice`)} />
                        </Field>
                        <Field label="Venda (R$)" htmlFor={`v${index}-price`} error={rowErrors?.salePrice?.message}>
                          <Input id={`v${index}-price`} inputMode="decimal" {...register(`variants.${index}.salePrice`)} aria-invalid={!!rowErrors?.salePrice} />
                        </Field>
                        <Field label="Promo (R$)" htmlFor={`v${index}-promo`} error={rowErrors?.promotionalPrice?.message}>
                          <Input id={`v${index}-promo`} inputMode="decimal" placeholder="—" {...register(`variants.${index}.promotionalPrice`)} />
                        </Field>
                        <Field label="Estoque" htmlFor={`v${index}-stock`} error={rowErrors?.stock?.message}>
                          <Input id={`v${index}-stock`} type="number" min={0} inputMode="numeric" {...register(`variants.${index}.stock`)} />
                        </Field>
                        <Field label="Mínimo" htmlFor={`v${index}-min`} error={rowErrors?.minimumStock?.message}>
                          <Input id={`v${index}-min`} type="number" min={0} inputMode="numeric" {...register(`variants.${index}.minimumStock`)} />
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-offwhite px-4 py-8 text-center text-sm text-stone-ink">
                Nenhuma variante ainda. Gere as combinações acima ou adicione a variante padrão.
              </p>
            )}
          </section>
        </TabsContent>

        {/* ─── Mídia ─── */}
        <TabsContent value="media">
          <section className="space-y-4 rounded-2xl border border-hairline bg-paper p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">Mídias do produto</h2>
              <p className="text-sm text-stone-ink">Fotos de alta qualidade, formato retrato. A primeira imagem é a principal.</p>
            </div>
            <ImageUploader
              value={images.map((i) => ({ url: i.url, altText: i.altText ?? null }))}
              onChange={(next) => setValue("images", next.map((i) => ({ url: i.url, altText: i.altText ?? null })), { shouldDirty: true })}
            />
          </section>
        </TabsContent>

        {/* ─── SEO ─── */}
        <TabsContent value="seo">
          <section className="grid gap-6 rounded-2xl border border-hairline bg-paper p-5 sm:p-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="Título para o Google" htmlFor="seoTitle" optional hint={`${(seoTitle ?? "").length}/70 caracteres`} error={errors.seoTitle?.message}>
                <Input id="seoTitle" maxLength={70} {...register("seoTitle")} placeholder={name} />
              </Field>
              <Field label="Descrição para o Google" htmlFor="seoDescription" optional hint={`${(seoDescription ?? "").length}/170 caracteres`} error={errors.seoDescription?.message}>
                <Textarea id="seoDescription" maxLength={170} rows={4} {...register("seoDescription")} className="rounded-xl bg-paper" />
              </Field>
            </div>
            <div className="rounded-2xl bg-offwhite p-5">
              <p className="mb-3 text-xs font-semibold text-stone-ink">Prévia no Google</p>
              <p className="truncate text-xs text-[#4d5156]">Use Gazzeta › produtos › {product?.slug ?? "novo-produto"}</p>
              <p className="mt-1 truncate text-lg text-[#1a0dab]">{seoTitle || name || "Nome do produto"} · Use Gazzeta</p>
              <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">
                {seoDescription || "A descrição do produto aparece aqui quando não houver descrição de SEO."}
              </p>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-hairline bg-paper/95 px-4 py-3 backdrop-blur-md lg:bottom-0 lg:left-[15.5rem] lg:px-8">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
          <p className="hidden text-sm text-stone-ink sm:block">
            {variants.fields.length} {variants.fields.length === 1 ? "variante" : "variantes"} · {totalStock} em estoque
          </p>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/produtos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={pending} className="min-w-36">
              {pending ? <Loader2 className="animate-spin" /> : null}
              Salvar produto
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
