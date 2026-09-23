import { NextResponse } from "next/server";
import { urlAutorizacaoTikTok } from "@/lib/tiktok";

export async function GET(req: Request) {
  if (!process.env.TIKTOK_CLIENT_KEY) {
    return NextResponse.json(
      { erro: "TIKTOK_CLIENT_KEY não configurada nas variáveis de ambiente do Vercel" },
      { status: 500 }
    );
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/tiktok/callback`;
  const state = crypto.randomUUID();

  const res = NextResponse.redirect(urlAutorizacaoTikTok(redirectUri, state));
  res.cookies.set("tiktok_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
