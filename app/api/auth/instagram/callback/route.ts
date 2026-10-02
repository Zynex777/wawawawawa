import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { trocarCodePorToken, trocarPorTokenLongo, buscarContaInstagram } from "@/lib/instagram";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const erroInstagram = url.searchParams.get("error_description") || url.searchParams.get("error");
  const stateSalvo = (req.headers.get("cookie") ?? "")
    .split("; ")
    .find((c) => c.startsWith("ig_oauth_state="))
    ?.split("=")[1];

  const irParaCanais = (erro?: string) => {
    const destino = new URL("/canais", url.origin);
    if (erro) destino.searchParams.set("erro", erro);
    return NextResponse.redirect(destino);
  };

  if (erroInstagram) return irParaCanais(`Instagram: ${erroInstagram}`);
  if (!code || !state || state !== stateSalvo) {
    return irParaCanais("Não foi possível confirmar a autorização do Instagram. Tente novamente.");
  }

  try {
    const redirectUri = `${url.origin}/api/auth/instagram/callback`;
    const curto = await trocarCodePorToken(code, redirectUri);
    const longo = await trocarPorTokenLongo(curto.accessToken);
    const conta = await buscarContaInstagram(longo.accessToken);

    const usuario = await getOrCreateUsuario();
    await prisma.canal.updateMany({
      where: { usuarioId: usuario.id, rede: "instagram" },
      data: {
        conectado: true,
        contaConectada: conta.username ? `@${conta.username}` : conta.igId,
        contaId: conta.igId,
        accessToken: longo.accessToken,
        refreshToken: null,
        expiraEm: new Date(Date.now() + longo.expiresIn * 1000),
      },
    });

    return irParaCanais();
  } catch (e: any) {
    return irParaCanais(e.message ?? "Falha ao conectar com o Instagram");
  }
}
