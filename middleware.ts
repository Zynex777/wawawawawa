import { NextRequest, NextResponse } from "next/server";
import { tokenValido, COOKIE_NAME } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isRotaAdmin = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isApiAdmin = pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";

  if (!isRotaAdmin && !isApiAdmin) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (await tokenValido(token)) return NextResponse.next();

  if (isApiAdmin) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
