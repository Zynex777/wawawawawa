"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/components/store";
import { nomeCanal, iconeCanal } from "@/lib/canais-meta";
import * as Icons from "lucide-react";
import { Check, ChevronDown } from "lucide-react";

// Canais com login OAuth de verdade já implementado. Os demais continuam
// usando o botão de conectar simulado até a integração de cada um ser feita.
const REDES_COM_LOGIN_REAL: Record<string, string> = {
  mercadolivre: "/api/auth/mercadolivre",
  facebook: "/api/auth/facebook",
  tiktok: "/api/auth/tiktok",
};

function TelegramCard({ conectado, contaConectada }: { conectado: boolean; contaConectada?: string | null }) {
  const [aberto, setAberto] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch("/api/canais/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botToken.trim(), chatId: chatId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Falha ao conectar");
      setAberto(false);
      window.location.reload();
    } catch (e: any) {
      setErro(e.message ?? "Falha ao conectar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="py-4">
      <button onClick={() => setAberto(!aberto)} className="flex w-full items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line">
            <Icons.Send size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold">Telegram</p>
            <p className="text-xs text-muted">
              Postagem automática via bot
              {conectado && contaConectada ? ` · ${contaConectada}` : ""}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-2">
          {conectado && (
            <span className="flex items-center gap-1.5 rounded-md bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
              <Check size={14} /> Conectado
            </span>
          )}
          <ChevronDown size={16} className={`text-muted transition-transform ${aberto ? "rotate-180" : ""}`} />
        </span>
      </button>

      {aberto && (
        <div className="mt-3 space-y-2 rounded-md border border-line p-3">
          <p className="text-xs text-muted">
            Cria um bot em @BotFather no Telegram, pega o token, adiciona o bot como admin do seu canal/grupo
            e cola o token e o ID do chat aqui.
          </p>
          <input
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="Token do bot"
            className="w-full rounded-md border border-line px-3 py-2 text-xs outline-none focus:border-cobalt"
          />
          <input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="ID do chat (ex.: @meucanal ou -1001234567890)"
            className="w-full rounded-md border border-line px-3 py-2 text-xs outline-none focus:border-cobalt"
          />
          {erro && <p className="text-xs text-coral">{erro}</p>}
          <button
            onClick={salvar}
            disabled={salvando}
            className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-paper disabled:opacity-50"
          >
            {salvando ? "Conectando…" : "Conectar"}
          </button>
        </div>
      )}
    </div>
  );
}

function CanaisConteudo() {
  const { canais, toggleCanal, carregando } = useApp();
  const params = useSearchParams();
  const erro = params.get("erro");

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Canais</h1>
      <p className="mt-1 text-muted">
        Conecte cada rede uma vez. Canais com API oficial postam sozinhos; os outros ficam marcados como
        manuais — você recebe o vídeo pronto e só confirma no app da rede.
      </p>

      {erro && (
        <div className="mt-4 rounded-md bg-coral/10 px-3 py-2 text-xs text-coral">
          Não deu pra conectar: {erro}
        </div>
      )}

      <div className="mt-8 divide-y divide-line border-y border-line">
        {canais.map((canal) => {
          if (canal.rede === "telegram") {
            return (
              <TelegramCard key={canal.id} conectado={canal.conectado} contaConectada={canal.contaConectada} />
            );
          }

          const Icone = (Icons as any)[iconeCanal(canal.rede)] ?? Icons.Radio;
          const linkLoginReal = REDES_COM_LOGIN_REAL[canal.rede];
          return (
            <div key={canal.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line">
                  <Icone size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{nomeCanal(canal.rede)}</p>
                  <p className="text-xs text-muted">
                    {canal.suporte === "automatico" ? "Postagem automática via API" : "Postagem manual (sem API pública)"}
                    {canal.conectado && canal.contaConectada ? ` · ${canal.contaConectada}` : ""}
                  </p>
                </div>
              </div>
              {canal.conectado ? (
                <span className="flex items-center gap-1.5 rounded-md bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                  <Check size={14} /> Conectado
                </span>
              ) : linkLoginReal ? (
                <a
                  href={linkLoginReal}
                  className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-paper"
                >
                  Conectar
                </a>
              ) : (
                <button
                  onClick={() => toggleCanal(canal.id).catch((e: Error) => alert(e.message))}
                  className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-paper"
                >
                  Conectar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Canais() {
  return (
    <Suspense fallback={null}>
      <CanaisConteudo />
    </Suspense>
  );
}
