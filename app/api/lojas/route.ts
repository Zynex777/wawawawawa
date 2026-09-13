import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";

export const dynamic = "force-dynamic";

export async function GET() {
  const usuario = await getOrCreateUsuario();
  const lojas = await prisma.loja.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(lojas);
}

export async function POST(req: Request) {
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
}
