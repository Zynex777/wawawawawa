import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { respostaErro } from "@/lib/api-utils";

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

// Cria uma postagem por canal selecionado. Canais com API oficial já
// implementada seriam publicados de verdade aqui; por enquanto toda
// postagem nasce como "manual", com o vídeo e a legenda prontos pra
// confirmação humana, exceto pelas redes já integradas de verdade.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const videoId = String(body.videoId ?? "");
    const canalIds: string[] = Array.isArray(body.canalIds) ? body.canalIds : [];

    if (!videoId || canalIds.length === 0) {
      return NextResponse.json({ erro: "Vídeo e ao menos um canal são obrigatórios" }, { status: 400 });
    }

    const postagens = await prisma.$transaction(
      canalIds.map((canalId) =>
        prisma.postagem.create({
          data: { videoId, canalId, status: "manual" },
        })
      )
    );

    return NextResponse.json(postagens, { status: 201 });
  } catch (e) {
    return respostaErro(e, "POST /api/postagens");
  }
}
