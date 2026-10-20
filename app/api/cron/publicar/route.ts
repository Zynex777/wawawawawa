import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicarNoCanal } from "@/lib/publicar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TENTATIVAS = 3;
const POR_EXECUCAO = 5;

// Chamada a cada 10 min pelo pg_cron do Supabase. Protegida por segredo.
async function executar(req: Request) {
  const segredo = process.env.CRON_SECRET;
  const enviado = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (!segredo || enviado !== segredo) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const agora = new Date();
  const due = await prisma.postagem.findMany({
    where: { status: "agendada", agendadaPara: { lte: agora } },
    orderBy: { agendadaPara: "asc" },
    take: POR_EXECUCAO,
  });

  const resumo = { publicadas: 0, pendentes: 0, falhas: 0, ignoradas: 0 };

  for (const tarefa of due) {
    // Trava: só quem conseguir mudar o status pra "em_execucao" publica. Evita duplicar.
    const trava = await prisma.postagem.updateMany({
      where: { id: tarefa.id, status: "agendada" },
      data: { status: "em_execucao" },
    });
    if (trava.count === 0) {
      resumo.ignoradas++;
      continue;
    }

    const canal = await prisma.canal.findUnique({ where: { id: tarefa.canalId } });
    const video = await prisma.video.findUnique({ where: { id: tarefa.videoId } });
    if (!canal || !video || !tarefa.textoGerado) {
      await prisma.postagem.update({
        where: { id: tarefa.id },
        data: { status: "falhou", erro: "Canal, produto ou texto não encontrado" },
      });
      resumo.falhas++;
      continue;
    }

    const r = await publicarNoCanal(canal, video, tarefa.textoGerado);

    if (r.estado === "publicado") {
      await prisma.postagem.update({
        where: { id: tarefa.id },
        data: { status: "publicado", dataPostada: new Date(), erro: null },
      });
      resumo.publicadas++;
    } else if (r.estado === "pendente") {
      // Instagram/Threads processando: termina no próximo ciclo (ver /api/postagens)
      await prisma.postagem.update({
        where: { id: tarefa.id },
        data: { status: "pendente", externoId: r.externoId },
      });
      resumo.pendentes++;
    } else {
      const tentativas = tarefa.tentativas + 1;
      if (tentativas < MAX_TENTATIVAS) {
        // Tenta de novo em 15 minutos
        await prisma.postagem.update({
          where: { id: tarefa.id },
          data: {
            status: "agendada",
            tentativas,
            agendadaPara: new Date(Date.now() + 15 * 60e3),
            erro: r.erro,
          },
        });
      } else {
        await prisma.postagem.update({
          where: { id: tarefa.id },
          data: { status: "falhou", tentativas, erro: r.erro },
        });
      }
      resumo.falhas++;
    }
  }

  return NextResponse.json({ ok: true, executadoEm: agora.toISOString(), ...resumo });
}

export async function GET(req: Request) {
  return executar(req);
}

export async function POST(req: Request) {
  return executar(req);
}
