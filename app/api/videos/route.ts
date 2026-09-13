import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { respostaErro } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const usuario = await getOrCreateUsuario();
    const videos = await prisma.video.findMany({
      where: { usuarioId: usuario.id },
      orderBy: { criadoEm: "desc" },
    });
    return NextResponse.json(videos);
  } catch (e) {
    return respostaErro(e, "GET /api/videos");
  }
}

export async function POST(req: Request) {
  try {
    const usuario = await getOrCreateUsuario();
    const body = await req.json();

    const produtoNome = String(body.produtoNome ?? "").trim();
    const linkAfiliado = String(body.linkAfiliado ?? "").trim();
    const lojaId = String(body.lojaId ?? "");
    if (!produtoNome || !linkAfiliado || !lojaId) {
      return NextResponse.json({ erro: "Produto, link e loja são obrigatórios" }, { status: 400 });
    }

    const video = await prisma.video.create({
      data: {
        usuarioId: usuario.id,
        lojaId,
        produtoNome,
        linkAfiliado,
        legenda: body.legenda ? String(body.legenda) : null,
        urlArquivo: body.urlArquivo ? String(body.urlArquivo) : null,
        origem: body.origem === "galeria" ? "galeria" : "automatico",
        status: "rascunho",
      },
    });
    return NextResponse.json(video, { status: 201 });
  } catch (e) {
    return respostaErro(e, "POST /api/videos");
  }
}
