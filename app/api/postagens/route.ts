import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { respostaErro } from "@/lib/api-utils";
import { publicarVideoNaPagina } from "@/lib/facebook";
import { publicarVideoTikTok } from "@/lib/tiktok";
import { publicarVideoTelegram } from "@/lib/telegram";
import { publicarReel, renovarToken, statusContainer, publicarContainer } from "@/lib/instagram";
import { montarLegendaComLink } from "@/lib/legenda";

export const dynamic = "force-dynamic";
// O Instagram leva alguns segundos processando o vídeo antes de publicar
export const maxDuration = 60;

type CanalLinha = {
  id: string;
  rede: string;
  conectado: boolean;
  accessToken: string | null;
  contaId: string | null;
  expiraEm: Date | null;
};

const SETE_DIAS = 7 * 24 * 3600 * 1000;

// Token do Instagram dura ~60 dias; renova sozinho quando faltar menos de 7
async function tokenInstagramValido(canal: CanalLinha): Promise<string> {
  const token = canal.accessToken!;
  if (canal.expiraEm && canal.expiraEm.getTime() - Date.now() < SETE_DIAS) {
    try {
      const novo = await renovarToken(token);
      await prisma.canal.update({
        where: { id: canal.id },
        data: { accessToken: novo.accessToken, expiraEm: new Date(Date.now() + novo.expiresIn * 1000) },
      });
      return novo.accessToken;
    } catch {
      // Se não deu pra renovar (token já vencido), tenta com o atual e o erro aparece no Histórico
    }
  }
  return token;
}

// Reels que ficaram "processando": verifica de novo e publica se o Instagram terminou
async function finalizarReelsPendentes(usuarioId: string) {
  const pendentes = await prisma.postagem.findMany({
    where: {
      status: "pendente",
      externoId: { not: null },
      canal: { rede: "instagram" },
      video: { usuarioId },
    },
    include: { canal: true },
    take: 5,
  });

  for (const p of pendentes) {
    try {
      const token = p.canal.accessToken!;
      const { status, detalhe } = await statusContainer(p.externoId!, token);
      if (status === "FINISHED") {
        await publicarContainer(p.canal.contaId!, token, p.externoId!);
        await prisma.postagem.update({
          where: { id: p.id },
          data: { status: "publicado", dataPostada: new Date() },
        });
      } else if (status === "PUBLISHED") {
        await prisma.postagem.update({
          where: { id: p.id },
          data: { status: "publicado", dataPostada: new Date() },
        });
      } else if (status === "ERROR" || status === "EXPIRED") {
        await prisma.postagem.update({
          where: { id: p.id },
          data: { status: "falhou", erro: `O Instagram recusou o vídeo (${detalhe ?? status})` },
        });
      }
    } catch (e: any) {
      await prisma.postagem.update({
        where: { id: p.id },
        data: { status: "falhou", erro: e.message ?? "Falha ao finalizar o Reel" },
      });
    }
  }
}

export async function GET() {
  try {
    const usuario = await getOrCreateUsuario();
    await finalizarReelsPendentes(usuario.id).catch(() => {});
    const postagens = await prisma.postagem.findMany({
      where: { video: { usuarioId: usuario.id } },
      include: { video: true, canal: true },
      orderBy: { dataAgendada: "desc" },
    });
    return NextResponse.json(postagens);
  } catch (e) {
    return respostaErro(e, "GET /api/postagens");
  }
}

// Cria uma postagem por canal selecionado. Facebook, Instagram, Telegram e
// TikTok publicam de verdade (quando o vídeo tem arquivo enviado). Os demais
// nascem como "manual", com texto e vídeo prontos pra copiar.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const videoId = String(body.videoId ?? "");
    const canalIds: string[] = Array.isArray(body.canalIds) ? body.canalIds : [];

    if (!videoId || canalIds.length === 0) {
      return NextResponse.json({ erro: "Vídeo e ao menos um canal são obrigatórios" }, { status: 400 });
    }

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return NextResponse.json({ erro: "Vídeo não encontrado" }, { status: 404 });

    const canais = await prisma.canal.findMany({ where: { id: { in: canalIds } } });
    const legendaComLink = montarLegendaComLink(video.legenda, video.linkAfiliado);

    const postagens = await Promise.all(
      canais.map(async (canal: CanalLinha) => {
        const pronto = canal.conectado && canal.accessToken && video.urlArquivo;
        const publicado = () =>
          prisma.postagem.create({
            data: { videoId, canalId: canal.id, status: "publicado", dataPostada: new Date() },
          });

        try {
          if (canal.rede === "facebook" && pronto && canal.contaId) {
            await publicarVideoNaPagina(canal.contaId, canal.accessToken!, video.urlArquivo!, legendaComLink);
            return publicado();
          }

          if (canal.rede === "instagram" && pronto && canal.contaId) {
            const token = await tokenInstagramValido(canal);
            const r = await publicarReel(canal.contaId, token, video.urlArquivo!, legendaComLink);
            if (r.resultado === "publicado") return publicado();
            // Ainda processando: termina sozinho quando o Histórico for aberto
            return prisma.postagem.create({
              data: { videoId, canalId: canal.id, status: "pendente", externoId: r.containerId },
            });
          }

          if (canal.rede === "telegram" && pronto && canal.contaId) {
            await publicarVideoTelegram(canal.accessToken!, canal.contaId, video.urlArquivo!, legendaComLink);
            return publicado();
          }

          if (canal.rede === "tiktok" && pronto) {
            await publicarVideoTikTok(canal.accessToken!, video.urlArquivo!, legendaComLink);
            return publicado();
          }

          // Rede manual, ou vídeo sem arquivo enviado da galeria
          return prisma.postagem.create({ data: { videoId, canalId: canal.id, status: "manual" } });
        } catch (e: any) {
          return prisma.postagem.create({
            data: { videoId, canalId: canal.id, status: "falhou", erro: e.message ?? "Falha ao publicar" },
          });
        }
      })
    );

    return NextResponse.json(postagens, { status: 201 });
  } catch (e) {
    return respostaErro(e, "POST /api/postagens");
  }
}
