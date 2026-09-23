"use client";

import { useState } from "react";
import { useApp } from "@/components/store";
import { nomeCanal } from "@/lib/canais-meta";
import { montarLegendaComLink } from "@/lib/legenda";
import { Copy, Check, X, ChevronDown } from "lucide-react";

const rotulos: Record<string, string> = {
  publicado: "Publicado",
  pendente: "Pendente",
  falhou: "Falhou",
  manual: "Aguardando confirmação manual",
};

const cores: Record<string, string> = {
  publicado: "text-success bg-success/10",
  pendente: "text-muted bg-line/60",
  falhou: "text-coral bg-coral/10",
  manual: "text-cobalt bg-cobalt/10",
};

export default function Historico() {
  const { postagens, videos, canais, marcarPostagem } = useApp();
  const [aberta, setAberta] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  if (postagens.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="mt-4 text-sm text-muted">Nenhuma postagem ainda.</p>
      </div>
    );
  }

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 1500);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Histórico</h1>
      <p className="mt-1 text-sm text-muted">
        "Aguardando confirmação manual" significa que essa rede ainda não posta sozinha — abra o item pra
        pegar o vídeo/legenda prontos e poste você mesmo, depois marque como feito.
      </p>

      <div className="mt-6 divide-y divide-line border-y border-line">
        {postagens.map((p) => {
          const video = videos.find((v) => v.id === p.videoId);
          const canal = canais.find((c) => c.id === p.canalId);
          const manual = p.status === "manual";
          const expandido = aberta === p.id;

          return (
            <div key={p.id} className="py-3">
              <button
                onClick={() => manual && setAberta(expandido ? null : p.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-semibold">{video?.produtoNome ?? "Vídeo removido"}</p>
                  <p className="text-xs text-muted">{canal ? nomeCanal(canal.rede) : ""}</p>
                </div>
                <span className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${cores[p.status]}`}>
                    {rotulos[p.status]}
                  </span>
                  {manual && (
                    <ChevronDown size={16} className={`text-muted transition-transform ${expandido ? "rotate-180" : ""}`} />
                  )}
                </span>
              </button>

              {p.status === "falhou" && p.erro && (
                <p className="mt-1 text-xs text-coral">{p.erro}</p>
              )}

              {manual && expandido && (
                <div className="mt-3 space-y-3 rounded-md border border-line bg-white p-3">
                  {video && (
                    <div>
                      <p className="text-xs font-semibold text-muted">Texto pronto pra colar no post (legenda + link)</p>
                      <div className="mt-1 flex items-start justify-between gap-2">
                        <p className="whitespace-pre-line text-sm">
                          {montarLegendaComLink(video.legenda, video.linkAfiliado)}
                        </p>
                        <button
                          onClick={() =>
                            copiar(montarLegendaComLink(video.legenda, video.linkAfiliado), p.id + "-completo")
                          }
                          className="shrink-0 text-muted hover:text-ink"
                        >
                          {copiado === p.id + "-completo" ? <Check size={15} /> : <Copy size={15} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {!video?.urlArquivo && (
                    <p className="text-xs text-muted">
                      Vídeo sem arquivo anexado ainda — use o da sua galeria pra esse produto.
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => marcarPostagem(p.id, "publicado").catch((e: Error) => alert(e.message))}
                      className="flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-paper"
                    >
                      <Check size={14} /> Marcar como postado
                    </button>
                    <button
                      onClick={() => marcarPostagem(p.id, "falhou").catch((e: Error) => alert(e.message))}
                      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-coral"
                    >
                      <X size={14} /> Não deu pra postar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
