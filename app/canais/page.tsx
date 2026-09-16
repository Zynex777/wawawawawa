"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/components/store";
import { nomeCanal, iconeCanal } from "@/lib/canais-meta";
import * as Icons from "lucide-react";
import { Check } from "lucide-react";

// Canais com login OAuth de verdade já implementado. Os demais continuam
// usando o botão de conectar simulado até a integração de cada um ser feita.
const REDES_COM_LOGIN_REAL: Record<string, string> = {
  mercadolivre: "/api/auth/mercadolivre",
  facebook: "/api/auth/facebook",
};

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
                  onClick={() => toggleCanal(canal.id)}
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
