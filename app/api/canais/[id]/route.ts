import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const canalAtual = await prisma.canal.findUnique({ where: { id: params.id } });
  if (!canalAtual) return NextResponse.json({ erro: "Canal não encontrado" }, { status: 404 });

  const novoEstado = !canalAtual.conectado;
  const canal = await prisma.canal.update({
    where: { id: params.id },
    data: {
      conectado: novoEstado,
      contaConectada: novoEstado ? "@minha_conta" : null,
    },
  });
  return NextResponse.json(canal);
}
