import { NextResponse } from "next/server";
import { urlAutorizacaoInstagram } from "@/lib/instagram";

export async function GET(req: Request) {
  if (!process.env.IG_APP_ID) {
    return NextResponse.json(
      { erro: "IG_APP_ID não configurada nas variáveis de ambiente do Vercel" },
      { status: 500 }
    );
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/instagram/callback`;
  const state = crypto.randomUUID();

  const res = NextResponse.redirect(urlAutorizacaoInstagram(redirectUri, state));
  res.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
