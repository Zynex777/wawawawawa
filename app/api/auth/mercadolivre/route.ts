import { NextResponse } from "next/server";
import { urlAutorizacaoML } from "@/lib/mercadolivre";

export async function GET(req: Request) {
  if (!process.env.ML_CLIENT_ID) {
    return NextResponse.json(
      { erro: "ML_CLIENT_ID não configurada nas variáveis de ambiente do Vercel" },
      { status: 500 }
    );
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/mercadolivre/callback`;
  const state = crypto.randomUUID();

  const res = NextResponse.redirect(urlAutorizacaoML(redirectUri, state));
  res.cookies.set("ml_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
