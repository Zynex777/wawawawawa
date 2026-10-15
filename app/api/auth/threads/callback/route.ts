import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { trocarCodePorToken, trocarPorTokenLongo, buscarPerfilThreads } from "@/lib/threads";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const erroThreads = url.searchParams.get("error_description") || url.searchParams.get("error");
  const stateSalvo = (req.headers.get("cookie") ?? "")
    .split("; ")
    .find((c) => c.startsWith("threads_oauth_state="))
    ?.split("=")[1];

  const irParaCanais = (erro?: string) => {
    const destino = new URL("/canais", url.origin);
    if (erro) destino.searchParams.set("erro", erro);
    return NextResponse.redirect(destino);
  };

  if (erroThreads) return irParaCanais(`Threads: ${erroThreads}`);
  if (!code || !state || state !== stateSalvo) {
    return irParaCanais("Não foi possível confirmar a autorização do Threads. Tente novamente.");
  }

  try {
    const redirectUri = `${url.origin}/api/auth/threads/callback`;
    const curto = await trocarCodePorToken(code, redirectUri);
    const longo = await trocarPorTokenLongo(curto.accessToken);
    const perfil = await buscarPerfilThreads(longo.accessToken);

    const usuario = await getOrCreateUsuario();
    await prisma.canal.updateMany({
      where: { usuarioId: usuario.id, rede: "threads" },
      data: {
        conectado: true,
        contaConectada: perfil.username ? `@${perfil.username}` : perfil.id,
        contaId: perfil.id,
        accessToken: longo.accessToken,
        refreshToken: null,
        expiraEm: new Date(Date.now() + longo.expiresIn * 1000),
      },
    });
    return irParaCanais();
  } catch (e: any) {
    return irParaCanais(e.message ?? "Falha ao conectar com o Threads");
  }
}
