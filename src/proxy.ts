import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Checagem otimista: sem sessão, /admin, /pdv e /scanner vão para /login.
// A autorização definitiva (papel e permissão) acontece nos layouts e Server Actions.
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  if (!request.auth) {
    const url = new URL("/login", request.nextUrl.origin);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/pdv/:path*", "/scanner/:path*"],
};
