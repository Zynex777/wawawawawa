import { NextResponse } from "next/server";
import { senhaCorreta, gerarTokenSessao, COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const body = await req.json();
  const senha = String(body.senha ?? "");

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { erro: "ADMIN_PASSWORD não configurada nas variáveis de ambiente do Vercel" },
      { status: 500 }
    );
  }

  if (!(await senhaCorreta(senha))) {
    return NextResponse.json({ erro: "Senha incorreta" }, { status: 401 });
  }

  const token = await gerarTokenSessao();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
