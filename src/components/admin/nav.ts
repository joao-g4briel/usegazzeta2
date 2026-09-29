import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Megaphone,
  Package,
  ScanBarcode,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  badge?: "orders" | "lowStock";
};

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { href: "/admin/produtos", label: "Produtos", icon: Package, permission: "products" },
  { href: "/admin/categorias", label: "Categorias", icon: Tags, permission: "categories" },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, permission: "orders", badge: "orders" },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes, permission: "inventory", badge: "lowStock" },
  { href: "/admin/clientes", label: "Clientes", icon: Users, permission: "customers" },
  { href: "/pdv", label: "PDV", icon: Store, permission: "pdv" },
  { href: "/pdv/scanner", label: "Scanner", icon: ScanBarcode, permission: "scanner" },
  { href: "/admin/cupons", label: "Cupons", icon: TicketPercent, permission: "coupons" },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone, permission: "marketing" },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, permission: "reports" },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, permission: "settings" },
];

// Navegação inferior no celular: o que o dono usa na loja.
export const MOBILE_NAV_HREFS = ["/admin/dashboard", "/pdv/scanner", "/pdv", "/admin/pedidos", "/admin/produtos"];
