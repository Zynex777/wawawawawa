import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { respostaErro } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const usuario = await getOrCreateUsuario();
    const lojas = await prisma.loja.findMany({
      where: { usuarioId: usuario.id },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(lojas);
  } catch (e) {
    return respostaErro(e, "GET /api/lojas");
  }
}

export async function POST(req: Request) {
  try {
    const usuario = await getOrCreateUsuario();
    const body = await req.json();
    const nome = String(body.nome ?? "").trim();
    if (!nome) return NextResponse.json({ erro: "Nome da loja é obrigatório" }, { status: 400 });

    const loja = await prisma.loja.create({
      data: {
        usuarioId: usuario.id,
        nome,
        padrao: false,
        templateLink: body.templateLink ? String(body.templateLink) : null,
      },
    });
    return NextResponse.json(loja, { status: 201 });
  } catch (e) {
    return respostaErro(e, "POST /api/lojas");
  }
}
