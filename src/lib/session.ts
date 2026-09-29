import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { can, homeFor, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/lib/constants";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.storeId || !u.role) return null;
  return {
    id: u.id,
    name: u.name ?? "Equipe",
    email: u.email ?? "",
    role: u.role,
    storeId: u.storeId,
  };
}

// Para páginas: sem sessão → login; sem permissão → área inicial do perfil.
export async function requirePageUser(permission?: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (permission && !can(user.role, permission)) redirect(homeFor(user.role));
  return user;
}

// Para Server Actions: lança erro seguro para exibir.
export async function requireActionUser(permission?: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new DomainError("Sua sessão expirou. Entre novamente.", "UNAUTHENTICATED");
  if (permission && !can(user.role, permission)) {
    throw new DomainError("Seu perfil não tem permissão para esta ação.", "FORBIDDEN");
  }
  return user;
}
