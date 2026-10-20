import { prisma } from "@/lib/db";
import { publicarVideoNaPagina, publicarFotoNaPagina } from "@/lib/facebook";
import { publicarVideoTikTok } from "@/lib/tiktok";
import { publicarVideoTelegram, publicarFotoTelegram } from "@/lib/telegram";
import { publicarReel, publicarFoto, renovarToken as renovarIG } from "@/lib/instagram";
import { publicarPost as publicarThreads, renovarToken as renovarTh } from "@/lib/threads";

export type CanalPublicacao = {
  id: string;
  rede: string;
  conectado: boolean;
  accessToken: string | null;
  contaId: string | null;
  expiraEm: Date | null;
};

export type VideoPublicacao = {
  urlArquivo: string | null;
  urlImagem: string | null;
};

export type ResultadoPublicacao =
  | { estado: "publicado"; externoId?: string }
  | { estado: "pendente"; externoId: string }
  | { estado: "falhou"; erro: string };

const SETE_DIAS = 7 * 24 * 3600 * 1000;

// Renova token de Instagram/Threads quando faltar menos de 7 dias
async function tokenAtual(canal: CanalPublicacao): Promise<string> {
  const token = canal.accessToken!;
  if (!canal.expiraEm || canal.expiraEm.getTime() - Date.now() >= SETE_DIAS) return token;
  if (canal.rede !== "instagram" && canal.rede !== "threads") return token;
  try {
    const novo = canal.rede === "instagram" ? await renovarIG(token) : await renovarTh(token);
    await prisma.canal.update({
      where: { id: canal.id },
      data: { accessToken: novo.accessToken, expiraEm: new Date(Date.now() + novo.expiresIn * 1000) },
    });
    return novo.accessToken;
  } catch {
    return token;
  }
}

// Publica o texto já pronto no canal, usando foto ou vídeo do produto.
// Vídeo tem prioridade; sem vídeo, usa a foto. Canal sem mídia não publica.
export async function publicarNoCanal(
  canal: CanalPublicacao,
  video: VideoPublicacao,
  texto: string
): Promise<ResultadoPublicacao> {
  if (!canal.conectado || !canal.accessToken) {
    return { estado: "falhou", erro: "Canal desconectado" };
  }
  const tipo: "video" | "foto" | null = video.urlArquivo ? "video" : video.urlImagem ? "foto" : null;

  try {
    if (canal.rede === "facebook" && canal.contaId && tipo) {
      if (tipo === "video") await publicarVideoNaPagina(canal.contaId, canal.accessToken, video.urlArquivo!, texto);
      else await publicarFotoNaPagina(canal.contaId, canal.accessToken, video.urlImagem!, texto);
      return { estado: "publicado" };
    }

    if (canal.rede === "telegram" && canal.contaId && tipo) {
      if (tipo === "video") await publicarVideoTelegram(canal.accessToken, canal.contaId, video.urlArquivo!, texto);
      else await publicarFotoTelegram(canal.accessToken, canal.contaId, video.urlImagem!, texto);
      return { estado: "publicado" };
    }

    if (canal.rede === "instagram" && canal.contaId && tipo) {
      const token = await tokenAtual(canal);
      const r =
        tipo === "video"
          ? await publicarReel(canal.contaId, token, video.urlArquivo!, texto)
          : await publicarFoto(canal.contaId, token, video.urlImagem!, texto);
      return r.resultado === "publicado"
        ? { estado: "publicado" }
        : { estado: "pendente", externoId: r.containerId };
    }

    if (canal.rede === "threads" && canal.contaId) {
      const token = await tokenAtual(canal);
      const r = await publicarThreads({
        userId: canal.contaId,
        token,
        texto,
        urlVideo: tipo === "video" ? video.urlArquivo! : undefined,
        urlImagem: tipo === "foto" ? video.urlImagem! : undefined,
      });
      return r.resultado === "publicado"
        ? { estado: "publicado" }
        : { estado: "pendente", externoId: r.containerId };
    }

    if (canal.rede === "tiktok" && tipo === "video") {
      await publicarVideoTikTok(canal.accessToken, video.urlArquivo!, texto);
      return { estado: "publicado" };
    }

    return { estado: "falhou", erro: "Essa rede não recebe este tipo de conteúdo automaticamente" };
  } catch (e: any) {
    return { estado: "falhou", erro: e?.message ?? "Falha ao publicar" };
  }
}
