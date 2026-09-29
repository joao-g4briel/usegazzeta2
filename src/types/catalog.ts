import type {
  InventoryMovementType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductBadge,
  VariantKind,
} from "@/lib/constants";

// DTOs serializáveis (números no lugar de Decimal) trocados entre servidor e UI.

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  variantKind: VariantKind;
  position: number;
  active: boolean;
  productCount?: number;
};

export type ProductImageDTO = {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  position: number;
  variantId: string | null;
};

// Variante pública (loja): nunca carrega custo.
export type PublicVariantDTO = {
  id: string;
  sku: string;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  tone: string | null;
  volume: string | null;
  label: string;
  salePrice: number;
  promotionalPrice: number | null;
  price: number;
  stock: number;
};

export type VariantDTO = PublicVariantDTO & {
  productId: string;
  barcode: string | null;
  costPrice: number;
  minimumStock: number;
  active: boolean;
  position: number;
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  active: boolean;
  featured: boolean;
  newProduct: boolean;
  onSale: boolean;
  badge: ProductBadge | null;
  category: { id: string; name: string; slug: string; variantKind: VariantKind };
  image: string | null;
  totalStock: number;
  priceFrom: number;
  priceTo: number;
  lowStockCount: number;
  outOfStockCount: number;
  variants: VariantDTO[];
  createdAt: string;
};

export type ProductEditDTO = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string | null;
  brand: string | null;
  basePrice: number | null;
  active: boolean;
  featured: boolean;
  newProduct: boolean;
  onSale: boolean;
  badge: ProductBadge | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ProductImageDTO[];
  variants: VariantDTO[];
};

export type StoreProductCard = {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  variantKind: VariantKind;
  image: string | null;
  imageAlt: string | null;
  price: number;
  compareAtPrice: number | null;
  badge: ProductBadge | null;
  totalStock: number;
  available: boolean;
  swatches: { color: string; hex: string | null }[];
  installments: { count: number; value: number } | null;
  singleVariantId: string | null;
  variants: PublicVariantDTO[];
};

export type StoreProductDetail = StoreProductCard & {
  description: string | null;
  brand: string | null;
  images: ProductImageDTO[];
  seoTitle: string | null;
  seoDescription: string | null;
};

// Item pronto para o carrinho do PDV (scanner, busca ou catálogo).
export type PosVariant = {
  variantId: string;
  productId: string;
  productName: string;
  categoryName: string;
  variantKind: VariantKind;
  label: string;
  details: { label: string; value: string }[];
  sku: string;
  barcode: string | null;
  price: number;
  stock: number;
  image: string | null;
  colorHex: string | null;
};

export type MovementDTO = {
  id: string;
  type: InventoryMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string | null;
  supplier: string | null;
  unitCost: number | null;
  referenceType: string | null;
  referenceId: string | null;
  referenceLabel: string | null;
  createdAt: string;
  userName: string | null;
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
};

export type OrderListItem = {
  id: string;
  number: number;
  customerName: string;
  customerId: string;
  itemThumbs: { image: string | null; name: string; variantKind: VariantKind }[];
  itemCount: number;
  total: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
};

export type SaleListItem = {
  id: string;
  number: number;
  customerName: string | null;
  sellerName: string | null;
  itemCount: number;
  total: number;
  status: "COMPLETED" | "CANCELED";
  methods: PaymentMethod[];
  createdAt: string;
};
