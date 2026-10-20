import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { respostaErro } from "@/lib/api-utils";
import { diasDoPeriodo, horarioSP, republicarAposDias, LIMITE_POR_TIPO } from "@/lib/agenda";
import { escolherModelo, gerarTexto, TOTAL_MODELOS } from "@/lib/textos";

export const dynamic = "force-dynamic";

const STATUS_PENDENTES = ["aguardando_aprovacao", "agendada", "pausada", "em_execucao", "pendente", "publicado"];

export async function GET() {
  try {
    const usuario = await getOrCreateUsuario();
    const progs = await prisma.programacao.findMany({
      where: { usuarioId: usuario.id },
      orderBy: { criadoEm: "desc" },
      take: 20,
    });
    const tarefas = await prisma.postagem.findMany({
      where: { programacaoId: { in: progs.map((p: { id: string }) => p.id) } },
      select: { programacaoId: true, status: true },
    });
    const contagem = (id: string) => {
      const mine = tarefas.filter((t: { programacaoId: string | null }) => t.programacaoId === id);
      const cont = (st: string) => mine.filter((t: { status: string }) => t.status === st).length;
      return {
        aguardandoAprovacao: cont("aguardando_aprovacao"),
        agendadas: cont("agendada"),
        pausadas: cont("pausada"),
        publicadas: mine.filter((t: { status: string }) => t.status === "publicado").length,
        falhas: cont("falhou"),
      };
    };
    return NextResponse.json(progs.map((p: any) => ({ ...p, ...contagem(p.id) })));
  } catch (e) {
    return respostaErro(e, "GET /api/programacoes");
  }
}

// Cria a programação: gera todas as publicações (dia × horário × rede) já com texto.
// Se aprovacao=true, ficam aguardando sua aprovação. Nada é publicado aqui.
export async function POST(req: Request) {
  try {
    const usuario = await getOrCreateUsuario();
    const body = await req.json();
    const redes: string[] = Array.isArray(body.redes) ? body.redes : [];
    const periodo: string = String(body.periodo ?? "amanha");
    const dias = body.dias ? Number(body.dias) : undefined;
    const horarios: string[] = Array.isArray(body.horarios) && body.horarios.length ? body.horarios : ["10:00", "19:00"];
    const modo: string = ["novos", "republicar", "alternar"].includes(body.modo) ? body.modo : "novos";
    const aprovacao = body.aprovacao !== false;

    if (redes.length === 0) return NextResponse.json({ erro: "Escolha pelo menos uma rede" }, { status: 400 });

    const agora = new Date();
    const canais = await prisma.canal.findMany({
      where: { usuarioId: usuario.id, rede: { in: redes }, conectado: true, suporte: "automatico" },
    });
    if (canais.length === 0) {
      return NextResponse.json(
        { erro: "Nenhuma das redes escolhidas está conectada e com postagem automática." },
        { status: 400 }
      );
    }

    // Horários que ainda não passaram (com 5 min de folga)
    const slots: Date[] = [];
    for (const dia of diasDoPeriodo(periodo, dias, agora)) {
      for (const h of horarios) {
        const s = horarioSP(dia, h);
        if (s.getTime() > agora.getTime() + 5 * 60e3) slots.push(s);
      }
    }
    slots.sort((a, b) => a.getTime() - b.getTime());
    if (slots.length === 0) {
      return NextResponse.json(
        { erro: "Os horários escolhidos já passaram. Escolha amanhã ou outro período." },
        { status: 400 }
      );
    }

    const videos = await prisma.video.findMany({
      where: { usuarioId: usuario.id, OR: [{ urlArquivo: { not: null } }, { urlImagem: { not: null } }] },
      orderBy: { criadoEm: "desc" },
    });
    if (videos.length === 0) {
      return NextResponse.json({ erro: "Nenhum produto com foto ou vídeo pra publicar." }, { status: 400 });
    }

    const programacaoId = crypto.randomUUID();
    const lote: any[] = [];
    const previas: { rede: string; texto: string }[] = [];
    let lacunas = 0;
    const porRede: Record<string, number> = {};

    for (const canal of canais) {
      const historico = await prisma.postagem.findMany({
        where: { canalId: canal.id, status: { not: "falhou" } },
        select: { videoId: true, status: true, dataPostada: true },
      });
      const jaUsados = new Set<string>(historico.map((h: { videoId: string }) => h.videoId));
      const ultimoPublicado = new Map<string, Date>();
      for (const h of historico) {
        if (h.status === "publicado" && h.dataPostada) {
          const atual = ultimoPublicado.get(h.videoId);
          if (!atual || h.dataPostada > atual) ultimoPublicado.set(h.videoId, h.dataPostada);
        }
      }
      const limite = new Date(agora.getTime() - republicarAposDias() * 24 * 3600e3);
      const novos = videos.filter((v: { id: string }) => !jaUsados.has(v.id));
      const repetiveis = videos
        .filter((v: { id: string }) => {
          const ult = ultimoPublicado.get(v.id);
          return ult && ult <= limite;
        })
        .sort((a: { id: string }, b: { id: string }) => ultimoPublicado.get(a.id)!.getTime() - ultimoPublicado.get(b.id)!.getTime());

      const usadosNoLote = new Set<string>();
      const limiteTexto = LIMITE_POR_TIPO[canal.rede as keyof typeof LIMITE_POR_TIPO] ?? LIMITE_POR_TIPO.default;
      let modeloAnterior: number | null = null;

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const ordem =
          modo === "republicar" ? [repetiveis, novos]
          : modo === "alternar" ? (i % 2 === 0 ? [novos, repetiveis] : [repetiveis, novos])
          : [novos, repetiveis];

        let escolhido: any = null;
        for (const lista of ordem) {
          escolhido = lista.find((v: { id: string }) => !usadosNoLote.has(v.id));
          if (escolhido) break;
        }
        if (!escolhido) {
          lacunas++;
          continue;
        }

        let modelo = escolherModelo(modeloAnterior);
        let texto = gerarTexto(escolhido, modelo, limiteTexto);
        for (let t = 0; !texto && t < TOTAL_MODELOS; t++) {
          modelo = (modelo + 1) % TOTAL_MODELOS;
          texto = gerarTexto(escolhido, modelo, limiteTexto);
        }
        if (!texto) {
          lacunas++;
          continue;
        }

        usadosNoLote.add(escolhido.id);
        modeloAnterior = modelo;
        porRede[canal.rede] = (porRede[canal.rede] ?? 0) + 1;
        if (previas.length < 3) previas.push({ rede: canal.rede, texto });

        lote.push({
          programacaoId,
          videoId: escolhido.id,
          canalId: canal.id,
          status: aprovacao ? "aguardando_aprovacao" : "agendada",
          dataAgendada: slot,
          agendadaPara: slot,
          chave: `${programacaoId}|${canal.id}|${slot.toISOString()}`,
          textoGerado: texto,
          modeloTexto: modelo,
        });
      }
    }

    if (lote.length === 0) {
      return NextResponse.json(
        { erro: "Não há produtos disponíveis pra esse modo. Tente 'Alternar' ou 'Publicar novos' com mais produtos." },
        { status: 400 }
      );
    }

    await prisma.programacao.create({
      data: {
        id: programacaoId,
        usuarioId: usuario.id,
        modo,
        periodo,
        redes: redes.join(","),
        horarios: horarios.join(","),
        aprovacao,
      },
    });
    await prisma.postagem.createMany({ data: lote, skipDuplicates: true });

    return NextResponse.json(
      {
        programacaoId,
        totalPublicacoes: lote.length,
        primeiraData: slots[0],
        ultimaData: slots[slots.length - 1],
        porRede,
        lacunas,
        previas,
        aguardandoAprovacao: aprovacao,
      },
      { status: 201 }
    );
  } catch (e) {
    return respostaErro(e, "POST /api/programacoes");
  }
}
