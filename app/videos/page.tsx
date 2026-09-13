"use client";

import Link from "next/link";
import { useApp } from "@/components/store";
import { Send, Film } from "lucide-react";

export default function Videos() {
  const { videos, lojas } = useApp();

  if (videos.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Vídeos</h1>
        <div className="mt-10 flex flex-col items-center gap-3 rounded-md border border-dashed border-line py-16 text-center">
          <Film size={28} className="text-muted" />
          <p className="text-sm text-muted">Nenhum vídeo ainda. Importe um produto pra começar.</p>
          <Link href="/produtos/importar" className="mt-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper">
            Importar produto
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Vídeos</h1>
      <p className="mt-1 text-muted">Banco de vídeos prontos para postar, organizados por loja.</p>

      <div className="mt-8 divide-y divide-line border-y border-line">
        {videos.map((v) => {
          const loja = lojas.find((l) => l.id === v.lojaId);
          return (
            <div key={v.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-semibold">{v.produtoNome}</p>
                <p className="text-xs text-muted">
                  {loja?.nome ?? "Loja"} · {v.origem === "automatico" ? "vídeo automático" : "vídeo da galeria"}
                </p>
              </div>
              <Link
                href={`/postar?video=${v.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:border-ink"
              >
                <Send size={14} /> Postar
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
