import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { trocarCodePorToken, buscarPerfilTikTok } from "@/lib/tiktok";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateSalvo = (req.headers.get("cookie") ?? "")
    .split("; ")
    .find((c) => c.startsWith("tiktok_oauth_state="))
    ?.split("=")[1];

  const irParaCanais = (erro?: string) => {
    const destino = new URL("/canais", url.origin);
    if (erro) destino.searchParams.set("erro", erro);
    return NextResponse.redirect(destino);
  };

  if (!code || !state || state !== stateSalvo) {
    return irParaCanais("Não foi possível confirmar a autorização do TikTok. Tente novamente.");
  }

  try {
    const redirectUri = `${url.origin}/api/auth/tiktok/callback`;
    const token = await trocarCodePorToken(code, redirectUri);
    const nomeExibicao = await buscarPerfilTikTok(token.access_token);

    const usuario = await getOrCreateUsuario();
    await prisma.canal.updateMany({
      where: { usuarioId: usuario.id, rede: "tiktok" },
      data: {
        conectado: true,
        contaConectada: nomeExibicao ?? token.open_id,
        contaId: token.open_id,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiraEm: new Date(Date.now() + token.expires_in * 1000),
      },
    });

    return irParaCanais();
  } catch (e: any) {
    return irParaCanais(e.message ?? "Falha ao conectar com o TikTok");
  }
}
