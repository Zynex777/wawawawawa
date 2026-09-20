import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { tokenValido, COOKIE_NAME } from "@/lib/admin-auth";
import { respostaErro } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// Redes com login OAuth de verdade — o admin não sobrescreve mais essas,
// pra não trocar por engano o token real por dado de teste.
const REDES_BLOQUEADAS = ["facebook", "mercadolivre"];

async function verificarAdmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return tokenValido(token);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await verificarAdmin())) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  try {
    const canalAtual = await prisma.canal.findUnique({ where: { id: params.id } });
    if (!canalAtual) return NextResponse.json({ erro: "Canal não encontrado" }, { status: 404 });
    if (REDES_BLOQUEADAS.includes(canalAtual.rede)) {
      return NextResponse.json(
        { erro: "Essa rede já tem login real — reconecte pelo botão Conectar na tela Canais." },
        { status: 403 }
      );
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
  } catch (e) {
    return respostaErro(e, "PATCH /api/admin/canais/[id]");
  }
}
