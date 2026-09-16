import { NextResponse } from "next/server";
import { urlAutorizacaoFacebook } from "@/lib/facebook";

export async function GET(req: Request) {
  if (!process.env.FB_APP_ID) {
    return NextResponse.json(
      { erro: "FB_APP_ID não configurada nas variáveis de ambiente do Vercel" },
      { status: 500 }
    );
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/facebook/callback`;
  const state = crypto.randomUUID();

  const res = NextResponse.redirect(urlAutorizacaoFacebook(redirectUri, state));
  res.cookies.set("fb_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
