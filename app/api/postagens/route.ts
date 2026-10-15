import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { respostaErro } from "@/lib/api-utils";
import { publicarVideoNaPagina, publicarFotoNaPagina } from "@/lib/facebook";
import { publicarVideoTikTok } from "@/lib/tiktok";
import { publicarVideoTelegram, publicarFotoTelegram } from "@/lib/telegram";
import { publicarReel, publicarFoto, renovarToken, statusContainer, publicarContainer } from "@/lib/instagram";
import { montarLegendaComLink } from "@/lib/legenda";
import { publicarPost as publicarThreads, finalizarPostPendente as finalizarThreads, renovarToken as renovarThreads } from "@/lib/threads";

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

// Token do Threads: mesma ideia, mas renovado pelo endpoint do Threads
async function tokenThreadsValido(canal: CanalLinha): Promise<string> {
  const token = canal.accessToken!;
  if (canal.expiraEm && canal.expiraEm.getTime() - Date.now() < SETE_DIAS) {
    try {
      const novo = await renovarThreads(token);
      await prisma.canal.update({
        where: { id: canal.id },
        data: { accessToken: novo.accessToken, expiraEm: new Date(Date.now() + novo.expiresIn * 1000) },
      });
      return novo.accessToken;
    } catch {
      // segue com o atual; se estiver vencido, o erro aparece no Histórico
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
      canal: { rede: { in: ["instagram", "threads"] } },
      video: { usuarioId },
    },
    include: { canal: true },
    take: 5,
  });

  for (const p of pendentes) {
    try {
      const token = p.canal.accessToken!;
      if (p.canal.rede === "threads") {
        const resultado = await finalizarThreads(p.canal.contaId!, token, p.externoId!);
        if (resultado === "publicado") {
          await prisma.postagem.update({ where: { id: p.id }, data: { status: "publicado", dataPostada: new Date() } });
        }
        continue;
      }
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
        const conectado = canal.conectado && canal.accessToken;
        // Vídeo tem prioridade; sem vídeo, posta a foto do produto
        const tipo: "video" | "foto" | null = video.urlArquivo ? "video" : video.urlImagem ? "foto" : null;
        const publicado = () =>
          prisma.postagem.create({
            data: { videoId, canalId: canal.id, status: "publicado", dataPostada: new Date() },
          });

        try {
          if (canal.rede === "facebook" && conectado && canal.contaId && tipo) {
            if (tipo === "video") {
              await publicarVideoNaPagina(canal.contaId, canal.accessToken!, video.urlArquivo!, legendaComLink);
            } else {
              await publicarFotoNaPagina(canal.contaId, canal.accessToken!, video.urlImagem!, legendaComLink);
            }
            return publicado();
          }

          if (canal.rede === "instagram" && conectado && canal.contaId && tipo) {
            const token = await tokenInstagramValido(canal);
            const r =
              tipo === "video"
                ? await publicarReel(canal.contaId, token, video.urlArquivo!, legendaComLink)
                : await publicarFoto(canal.contaId, token, video.urlImagem!, legendaComLink);
            if (r.resultado === "publicado") return publicado();
            return prisma.postagem.create({
              data: { videoId, canalId: canal.id, status: "pendente", externoId: r.containerId },
            });
          }

          if (canal.rede === "telegram" && conectado && canal.contaId && tipo) {
            if (tipo === "video") {
              await publicarVideoTelegram(canal.accessToken!, canal.contaId, video.urlArquivo!, legendaComLink);
            } else {
              await publicarFotoTelegram(canal.accessToken!, canal.contaId, video.urlImagem!, legendaComLink);
            }
            return publicado();
          }

          if (canal.rede === "threads" && conectado && canal.contaId) {
            const token = await tokenThreadsValido(canal);
            // Threads tem limite de 500 caracteres: corta a legenda antes de mexer no link
            const espaco = 500 - video.linkAfiliado.length - 2;
            const legendaCurta = (video.legenda ?? "").slice(0, Math.max(espaco, 0));
            const texto = montarLegendaComLink(legendaCurta, video.linkAfiliado);
            const r = await publicarThreads({
              userId: canal.contaId,
              token,
              texto,
              urlVideo: tipo === "video" ? video.urlArquivo! : undefined,
              urlImagem: tipo === "foto" ? video.urlImagem! : undefined,
            });
            if (r.resultado === "publicado") return publicado();
            return prisma.postagem.create({
              data: { videoId, canalId: canal.id, status: "pendente", externoId: r.containerId },
            });
          }

          // TikTok publica só vídeo por enquanto
          if (canal.rede === "tiktok" && conectado && tipo === "video") {
            await publicarVideoTikTok(canal.accessToken!, video.urlArquivo!, legendaComLink);
            return publicado();
          }

          // Rede manual, ou sem vídeo nem foto
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
