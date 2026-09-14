import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { respostaErro } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const status = String(body.status ?? "");
    if (!["publicado", "falhou"].includes(status)) {
      return NextResponse.json({ erro: "Status inválido" }, { status: 400 });
    }

    const postagem = await prisma.postagem.update({
      where: { id: params.id },
      data: {
        status,
        dataPostada: status === "publicado" ? new Date() : null,
      },
    });
    return NextResponse.json(postagem);
  } catch (e) {
    return respostaErro(e, "PATCH /api/postagens/[id]");
  }
}
