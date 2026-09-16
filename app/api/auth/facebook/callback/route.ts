import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { trocarCodePorToken, trocarPorTokenLongo, buscarPrimeiraPagina } from "@/lib/facebook";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateSalvo = (req.headers.get("cookie") ?? "")
    .split("; ")
    .find((c) => c.startsWith("fb_oauth_state="))
    ?.split("=")[1];

  const irParaCanais = (erro?: string) => {
    const destino = new URL("/canais", url.origin);
    if (erro) destino.searchParams.set("erro", erro);
    return NextResponse.redirect(destino);
  };

  if (!code || !state || state !== stateSalvo) {
    return irParaCanais("Não foi possível confirmar a autorização do Facebook. Tente novamente.");
  }

  try {
    const redirectUri = `${url.origin}/api/auth/facebook/callback`;
    const tokenCurto = await trocarCodePorToken(code, redirectUri);
    const tokenLongo = await trocarPorTokenLongo(tokenCurto.access_token);
    const pagina = await buscarPrimeiraPagina(tokenLongo.access_token);

    const usuario = await getOrCreateUsuario();
    await prisma.canal.updateMany({
      where: { usuarioId: usuario.id, rede: "facebook" },
      data: {
        conectado: true,
        contaConectada: pagina.name,
        contaId: pagina.id,
        accessToken: pagina.access_token,
        refreshToken: null,
        expiraEm: new Date(Date.now() + (tokenLongo.expires_in ?? 60 * 24 * 60 * 60) * 1000),
      },
    });

    return irParaCanais();
  } catch (e: any) {
    return irParaCanais(e.message ?? "Falha ao conectar com o Facebook");
  }
}
