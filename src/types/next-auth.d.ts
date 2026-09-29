import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      storeId: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    storeId?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    storeId?: string;
  }
}
