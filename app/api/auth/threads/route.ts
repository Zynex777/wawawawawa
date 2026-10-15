import { NextResponse } from "next/server";
import { urlAutorizacaoThreads } from "@/lib/threads";

export async function GET(req: Request) {
  if (!process.env.THREADS_APP_ID) {
    return NextResponse.json(
      { erro: "THREADS_APP_ID não configurada nas variáveis de ambiente do Vercel" },
      { status: 500 }
    );
  }
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/threads/callback`;
  const state = crypto.randomUUID();

  const res = NextResponse.redirect(urlAutorizacaoThreads(redirectUri, state));
  res.cookies.set("threads_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
