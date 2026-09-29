import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/shared/wordmark";
import { LoginForm } from "@/components/admin/login-form";
import { getSessionUser } from "@/lib/session";
import { homeFor } from "@/lib/permissions";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getSessionUser();
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : undefined;
  if (user) redirect(callbackUrl?.startsWith("/") ? callbackUrl : homeFor(user.role));

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-olive p-12 text-offwhite lg:flex">
        <Wordmark tone="light" size="lg" />
        <div className="relative z-10 max-w-md">
          <p className="font-serif text-[3.4rem] leading-[1.02] font-medium">
            Sua loja inteira,
            <span className="block">num só lugar para</span>
            <span className="font-script text-[1.45em] leading-[0.9] font-normal text-gold-mist">brilhar</span>
          </p>
          <p className="mt-6 max-w-sm text-[1.02rem] leading-relaxed text-offwhite">
            Loja virtual, painel e PDV lendo o mesmo estoque — cada peça, cada cor, cada tamanho.
          </p>
        </div>
        <p className="text-sm text-offwhite/90">Acesso restrito à equipe Use Gazzeta.</p>
        <div aria-hidden className="absolute -right-32 -bottom-32 size-[30rem] rounded-full border border-white/25" />
        <div aria-hidden className="absolute -right-10 -bottom-10 size-[22rem] rounded-full border border-white/20" />
      </div>

      <div className="flex flex-col justify-center bg-offwhite px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Wordmark tone="olive" />
          </div>
          <h1 className="font-serif text-[2.4rem] leading-tight font-medium">Bem-vinda de volta</h1>
          <p className="mt-2 mb-8 text-stone-ink">Entre para acessar o painel e o PDV.</p>
          <LoginForm callbackUrl={callbackUrl} />
          <Link href="/" className="mt-8 block text-center text-sm font-medium text-olive hover:underline">
            Ir para a loja
          </Link>
        </div>
      </div>
    </div>
  );
}
