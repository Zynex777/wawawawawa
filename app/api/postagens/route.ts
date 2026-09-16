import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { respostaErro } from "@/lib/api-utils";
import { publicarVideoNaPagina } from "@/lib/facebook";

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

// Cria uma postagem por canal selecionado. Pras redes já com integração real
// (por enquanto, só Facebook) e com o vídeo hospedado, publica de verdade e
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

    const postagens = await Promise.all(
      canais.map(async (canal: {
        id: string;
        rede: string;
        conectado: boolean;
        accessToken: string | null;
        contaId: string | null;
      }) => {
        if (
          canal.rede === "facebook" &&
          canal.conectado &&
          canal.accessToken &&
          canal.contaId &&
          video.urlArquivo
        ) {
          try {
            await publicarVideoNaPagina(canal.contaId, canal.accessToken, video.urlArquivo, video.legenda ?? undefined);
            return prisma.postagem.create({
              data: { videoId, canalId: canal.id, status: "publicado", dataPostada: new Date() },
            });
          } catch (e: any) {
            return prisma.postagem.create({
              data: { videoId, canalId: canal.id, status: "falhou", erro: e.message ?? "Falha ao publicar" },
            });
          }
        }

        return prisma.postagem.create({ data: { videoId, canalId: canal.id, status: "manual" } });
      })
    );

    return NextResponse.json(postagens, { status: 201 });
  } catch (e) {
    return respostaErro(e, "POST /api/postagens");
  }
}
