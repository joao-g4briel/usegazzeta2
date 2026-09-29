import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/lib/constants";

// Configuração sem acesso ao banco: usada pelo proxy.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: UserRole }).role;
        token.storeId = (user as { storeId: string }).storeId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.storeId = token.storeId as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
