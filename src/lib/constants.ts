// Constantes e rótulos compartilhados entre loja, painel e PDV.
// Os tipos espelham os enums do Prisma, mas não importam o client gerado,
// para poderem ser usados em Client Components.

export const STORE_SLUG = process.env.STORE_SLUG ?? "use-gazzeta";
export const STORE_TIMEZONE = "America/Sao_Paulo";
// O Brasil não tem horário de verão desde 2019: UTC-3 fixo.
export const STORE_UTC_OFFSET_HOURS = -3;

export const LOW_STOCK_LAST_UNITS = 3;

export type UserRole = "ADMIN" | "MANAGER" | "SELLER" | "STOCK";
export type VariantKind = "APPAREL" | "BEAUTY" | "FRAGRANCE" | "ACCESSORY" | "OTHER";
export type ProductBadge =
  | "MAIS_VENDIDO"
  | "NOVIDADE"
  | "OFERTA"
  | "TENDENCIA"
  | "FAVORITO"
  | "ULTIMAS_PECAS";
export type OrderStatus =
  | "AGUARDANDO_PAGAMENTO"
  | "PAGO"
  | "EM_SEPARACAO"
  | "ENVIADO"
  | "ENTREGUE"
  | "CANCELADO";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "CANCELED";
export type PaymentMethod = "PIX" | "DINHEIRO" | "CREDITO" | "DEBITO" | "OUTROS";
export type InventoryMovementType =
  | "ENTRADA"
  | "VENDA_PDV"
  | "VENDA_ONLINE"
  | "AJUSTE"
  | "DEVOLUCAO"
  | "CANCELAMENTO"
  | "PERDA";
export type CouponType = "PERCENTUAL" | "VALOR_FIXO";
export type ShippingMethod = "ENTREGA" | "RETIRADA";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administradora",
  MANAGER: "Gerente",
  SELLER: "Vendedora",
  STOCK: "Estoque",
};

export const VARIANT_KIND_LABELS: Record<VariantKind, string> = {
  APPAREL: "Cor e tamanho",
  BEAUTY: "Tom, cor ou volume",
  FRAGRANCE: "Volume",
  ACCESSORY: "Cor",
  OTHER: "Padrão",
};

export const BADGE_LABELS: Record<ProductBadge, string> = {
  MAIS_VENDIDO: "Mais vendido",
  NOVIDADE: "Novidade",
  OFERTA: "Oferta",
  TENDENCIA: "Tendência",
  FAVORITO: "Favorito",
  ULTIMAS_PECAS: "Últimas peças",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  EM_SEPARACAO: "Em separação",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "EM_SEPARACAO",
  "ENVIADO",
  "ENTREGUE",
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  REFUNDED: "Estornado",
  CANCELED: "Cancelado",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CREDITO: "Crédito",
  DEBITO: "Débito",
  OUTROS: "Outros",
};

export const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  ENTRADA: "Entrada",
  VENDA_PDV: "Venda PDV",
  VENDA_ONLINE: "Venda online",
  AJUSTE: "Ajuste",
  DEVOLUCAO: "Devolução",
  CANCELAMENTO: "Cancelamento",
  PERDA: "Perda",
};

export const ADJUSTMENT_REASONS = [
  { value: "CORRECAO", label: "Correção" },
  { value: "PERDA", label: "Perda" },
  { value: "AVARIA", label: "Avaria" },
  { value: "INVENTARIO", label: "Inventário (contagem)" },
  { value: "DEVOLUCAO", label: "Devolução de cliente" },
] as const;
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number]["value"];

export const APPAREL_SIZES = ["PP", "P", "M", "G", "GG", "Único"] as const;
export const FRAGRANCE_VOLUMES = ["15ml", "30ml", "50ml", "75ml", "100ml", "200ml"] as const;

// Cores conhecidas → hex para swatches. Cores fora da lista usam colorHex da variante.
export const COLOR_SWATCHES: Record<string, string> = {
  amarelo: "#F2DF8C",
  rosa: "#EDB4C4",
  "rosa claro": "#F4CCD4",
  lilás: "#C9B3DC",
  lilas: "#C9B3DC",
  verde: "#A9C98A",
  "verde sálvia": "#87977C",
  sálvia: "#87977C",
  preto: "#1E1E1E",
  branco: "#FAFAF7",
  "off-white": "#F3EEE3",
  bege: "#E4D3BC",
  nude: "#E2BFA6",
  vermelho: "#C0392B",
  vinho: "#6E1E2E",
  azul: "#6F8FB8",
  marinho: "#243A5E",
  jeans: "#5A7BA6",
  marrom: "#7A5236",
  caramelo: "#B27A45",
  dourado: "#C69B4A",
  prata: "#C0C4C8",
  laranja: "#E58D4E",
  coral: "#EE8C79",
  terracota: "#B8674A",
  "rosé": "#E8C1B8",
};

export function swatchFor(color?: string | null, hex?: string | null): string | null {
  if (hex) return hex;
  if (!color) return null;
  return COLOR_SWATCHES[color.trim().toLowerCase()] ?? null;
}

export const PAYMENT_METHODS: PaymentMethod[] = ["PIX", "DINHEIRO", "CREDITO", "DEBITO", "OUTROS"];
