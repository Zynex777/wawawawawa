import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { tokenValido, COOKIE_NAME } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function verificarAdmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return tokenValido(token);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await verificarAdmin())) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const canal = await prisma.canal.update({
    where: { id: params.id },
    data: {
      accessToken: body.accessToken !== undefined ? String(body.accessToken) || null : undefined,
      refreshToken: body.refreshToken !== undefined ? String(body.refreshToken) || null : undefined,
      contaConectada: body.contaConectada !== undefined ? String(body.contaConectada) || null : undefined,
      conectado: body.conectado !== undefined ? Boolean(body.conectado) : undefined,
    },
  });
  return NextResponse.json(canal);
}
