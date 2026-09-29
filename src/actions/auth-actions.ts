"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/admin";

export type LoginState = { error?: string; email?: string } | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Confira e-mail e senha.", email };
  }
  const callbackUrl = String(formData.get("callbackUrl") || "");
  const safeCallback = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/admin";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallback,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha incorretos.", email };
    }
    throw error;
  }
  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
