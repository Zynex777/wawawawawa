"use client";

import { useApp } from "@/components/store";
import { nomeCanal, iconeCanal } from "@/lib/canais-meta";
import * as Icons from "lucide-react";
import { Check } from "lucide-react";

export default function Canais() {
  const { canais, toggleCanal, carregando } = useApp();

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Canais</h1>
      <p className="mt-1 text-muted">
        Conecte cada rede uma vez. Canais com API oficial postam sozinhos; os outros ficam marcados como
        manuais — você recebe o vídeo pronto e só confirma no app da rede.
      </p>

      <div className="mt-8 divide-y divide-line border-y border-line">
        {canais.map((canal) => {
          const Icone = (Icons as any)[iconeCanal(canal.rede)] ?? Icons.Radio;
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
              <button
                onClick={() => toggleCanal(canal.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                  canal.conectado ? "bg-success/10 text-success" : "bg-ink text-paper"
                }`}
              >
                {canal.conectado ? (
                  <>
                    <Check size={14} /> Conectado
                  </>
                ) : (
                  "Conectar"
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
