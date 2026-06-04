import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/r/", "/api/", "/_next/", "/favicon", "/manifest", "/icon"];
const AUTH_PAGES   = ["/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sempre deixar passar rotas públicas
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Verificar se tem cookie de sessão do NextAuth
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value;

  const isLoggedIn  = !!sessionToken;
  const isLoginPage = AUTH_PAGES.includes(pathname);

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
