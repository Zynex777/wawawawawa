"use client";

import { useApp } from "@/components/store";
import { nomeCanal } from "@/lib/canais-meta";

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
  const { postagens, videos, canais } = useApp();

  if (postagens.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="mt-4 text-sm text-muted">Nenhuma postagem ainda.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Histórico</h1>
      <div className="mt-6 divide-y divide-line border-y border-line">
        {postagens.map((p) => {
          const video = videos.find((v) => v.id === p.videoId);
          const canal = canais.find((c) => c.id === p.canalId);
          return (
            <div key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold">{video?.produtoNome ?? "Vídeo removido"}</p>
                <p className="text-xs text-muted">{canal ? nomeCanal(canal.rede) : ""}</p>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${cores[p.status]}`}>
                {rotulos[p.status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
