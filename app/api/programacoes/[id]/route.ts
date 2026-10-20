import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { respostaErro } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// aprovar: libera as publicações pra saírem nos horários
// pausar / retomar: segura e libera a programação inteira
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { acao } = await req.json();
    const id = params.id;

    if (acao === "aprovar") {
      // Publicações cujo horário já passou não saem todas de uma vez: são marcadas como expiradas
      const expiradas = await prisma.postagem.updateMany({
        where: {
          programacaoId: id,
          status: "aguardando_aprovacao",
          agendadaPara: { lt: new Date(Date.now() - 30 * 60e3) },
        },
        data: { status: "expirada" },
      });
      const aprovadas = await prisma.postagem.updateMany({
        where: { programacaoId: id, status: "aguardando_aprovacao" },
        data: { status: "agendada" },
      });
      return NextResponse.json({ aprovadas: aprovadas.count, expiradas: expiradas.count });
    }

    if (acao === "pausar") {
      const r = await prisma.postagem.updateMany({
        where: { programacaoId: id, status: "agendada" },
        data: { status: "pausada" },
      });
      return NextResponse.json({ pausadas: r.count });
    }

    if (acao === "retomar") {
      const r = await prisma.postagem.updateMany({
        where: { programacaoId: id, status: "pausada" },
        data: { status: "agendada" },
      });
      return NextResponse.json({ retomadas: r.count });
    }

    return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
  } catch (e) {
    return respostaErro(e, "POST /api/programacoes/[id]");
  }
}
