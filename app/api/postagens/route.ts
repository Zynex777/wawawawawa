import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";

export const dynamic = "force-dynamic";

export async function GET() {
  const usuario = await getOrCreateUsuario();
  const postagens = await prisma.postagem.findMany({
    where: { video: { usuarioId: usuario.id } },
    include: { video: true, canal: true },
    orderBy: { dataAgendada: "desc" },
  });
  return NextResponse.json(postagens);
}

// Cria uma postagem por canal selecionado. Canais com API oficial já
// implementada seriam publicados de verdade aqui; por enquanto (nenhuma
// integração real de rede social está ligada ainda) toda postagem nasce
// como "manual", com o vídeo e a legenda prontos pra confirmação humana.
export async function POST(req: Request) {
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
}
