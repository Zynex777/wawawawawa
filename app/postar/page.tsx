"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/components/store";
import { nomeCanal, iconeCanal } from "@/lib/canais-meta";
import * as Icons from "lucide-react";
import { Check } from "lucide-react";

function PostarConteudo() {
  const { videos, canais, postarEm, carregando } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const videoIdParam = params.get("video");

  const [videoId, setVideoId] = useState(videoIdParam ?? videos[0]?.id ?? "");
  const conectados = canais.filter((c) => c.conectado);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const video = useMemo(() => videos.find((v) => v.id === videoId), [videos, videoId]);
  const todosSelecionados = selecionados.length === conectados.length && conectados.length > 0;

  function alternar(id: string) {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selecionarTodos() {
    setSelecionados(todosSelecionados ? [] : conectados.map((c) => c.id));
  }

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function postar() {
    if (!video || selecionados.length === 0) return;
    setEnviando(true);
    setErro("");
    try {
      await postarEm(video.id, selecionados);
      router.push("/historico");
    } catch (e: any) {
      setErro(e.message ?? "Falha ao postar");
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>;

  if (videos.length === 0) {
    return <p className="text-sm text-muted">Nenhum vídeo pronto ainda. Importe um produto primeiro.</p>;
  }

  if (conectados.length === 0) {
    return <p className="text-sm text-muted">Conecte pelo menos um canal antes de postar.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Postar</h1>
      <p className="mt-1 text-muted">Escolha o vídeo e os canais. Os automáticos publicam na hora; os manuais abrem prontos pra você confirmar.</p>

      <div className="mt-6">
        <label className="text-xs font-semibold text-muted">Vídeo</label>
        <select
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-cobalt"
        >
          {videos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.produtoNome}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted">Canais conectados</p>
        <button onClick={selecionarTodos} className="text-xs font-semibold text-cobalt">
          {todosSelecionados ? "Limpar seleção" : "Selecionar todos"}
        </button>
      </div>

      <div className="mt-2 divide-y divide-line border-y border-line">
        {conectados.map((canal) => {
          const Icone = (Icons as any)[iconeCanal(canal.rede)] ?? Icons.Radio;
          const marcado = selecionados.includes(canal.id);
          return (
            <button
              key={canal.id}
              onClick={() => alternar(canal.id)}
              className="flex w-full items-center justify-between py-3 text-left"
            >
              <span className="flex items-center gap-3">
                <Icone size={18} />
                <span className="text-sm">{nomeCanal(canal.rede)}</span>
                <span className="text-xs text-muted">
                  {canal.suporte === "automatico" ? "automático" : "manual"}
                </span>
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-sm border ${
                  marcado ? "border-cobalt bg-cobalt text-paper" : "border-line"
                }`}
              >
                {marcado && <Check size={13} />}
              </span>
            </button>
          );
        })}
      </div>

      {erro && <p className="mt-4 text-xs text-coral">{erro}</p>}

      <button
        onClick={postar}
        disabled={selecionados.length === 0 || enviando}
        className="mt-6 w-full rounded-md bg-coral py-3 text-sm font-semibold text-paper disabled:opacity-40 md:w-auto md:px-6"
      >
        {enviando ? "Postando…" : `Postar em ${selecionados.length || ""} ${selecionados.length === 1 ? "canal" : "canais"}`}
      </button>
    </div>
  );
}

export default function Postar() {
  return (
    <Suspense fallback={null}>
      <PostarConteudo />
    </Suspense>
  );
}
