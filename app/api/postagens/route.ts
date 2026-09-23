import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { respostaErro } from "@/lib/api-utils";
import { publicarVideoNaPagina } from "@/lib/facebook";
import { publicarVideoTikTok } from "@/lib/tiktok";
import { publicarVideoTelegram } from "@/lib/telegram";
import { montarLegendaComLink } from "@/lib/legenda";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const usuario = await getOrCreateUsuario();
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

type CanalLinha = {
  id: string;
  rede: string;
  conectado: boolean;
  accessToken: string | null;
  contaId: string | null;
};

// Cria uma postagem por canal selecionado. Pras redes já com integração real
// (Facebook, TikTok, Telegram) e com o vídeo hospedado, publica de verdade e
// grava o resultado. As demais continuam nascendo como "manual".
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
        const prontoParaAutomatico = canal.conectado && canal.accessToken && video.urlArquivo;

        try {
          if (canal.rede === "facebook" && prontoParaAutomatico && canal.contaId) {
            await publicarVideoNaPagina(canal.contaId, canal.accessToken!, video.urlArquivo!, legendaComLink);
          } else if (canal.rede === "tiktok" && prontoParaAutomatico) {
            await publicarVideoTikTok(canal.accessToken!, video.urlArquivo!, legendaComLink);
          } else if (canal.rede === "telegram" && prontoParaAutomatico && canal.contaId) {
            await publicarVideoTelegram(canal.accessToken!, canal.contaId, video.urlArquivo!, legendaComLink);
          } else {
            return prisma.postagem.create({ data: { videoId, canalId: canal.id, status: "manual" } });
          }

          return prisma.postagem.create({
            data: { videoId, canalId: canal.id, status: "publicado", dataPostada: new Date() },
          });
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
