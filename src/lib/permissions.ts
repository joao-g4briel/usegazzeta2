import type { UserRole } from "@/lib/constants";

// Permissões por área. ADMIN é o único perfil ativo no MVP,
// mas o banco e as telas já respeitam estes papéis.
export type Permission =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "inventory"
  | "customers"
  | "pdv"
  | "scanner"
  | "coupons"
  | "marketing"
  | "reports"
  | "settings";

const ALL: Permission[] = [
  "dashboard",
  "products",
  "categories",
  "orders",
  "inventory",
  "customers",
  "pdv",
  "scanner",
  "coupons",
  "marketing",
  "reports",
  "settings",
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: ALL,
  MANAGER: ALL.filter((p) => p !== "settings"),
  SELLER: ["pdv", "scanner", "customers"],
  STOCK: ["products", "scanner", "inventory"],
};

export function can(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Rota inicial de cada perfil depois do login.
export function homeFor(role: UserRole): string {
  if (can(role, "dashboard")) return "/admin/dashboard";
  if (can(role, "pdv")) return "/pdv";
  if (can(role, "inventory")) return "/admin/estoque";
  return "/pdv/scanner";
}
