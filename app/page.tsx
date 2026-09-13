"use client";

import Link from "next/link";
import { useApp } from "@/components/store";
import { ArrowRight } from "lucide-react";

export default function Painel() {
  const { canais, lojas, videos, postagens } = useApp();
  const conectados = canais.filter((c) => c.conectado).length;
  const publicadas = postagens.filter((p) => p.status === "publicado").length;
  const pendentes = postagens.filter((p) => p.status === "manual" || p.status === "pendente").length;

  const cartoes = [
    { label: "Canais conectados", valor: `${conectados}/${canais.length}`, href: "/canais" },
    { label: "Lojas cadastradas", valor: `${lojas.length}`, href: "/lojas" },
    { label: "Vídeos no banco", valor: `${videos.length}`, href: "/videos" },
    { label: "Postagens pendentes", valor: `${pendentes}`, href: "/historico" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Painel</h1>
      <p className="mt-1 text-muted">Cole o link do produto, revise o vídeo e poste em todos os canais de uma vez.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cartoes.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-md border border-line px-4 py-4 transition-colors hover:border-ink"
          >
            <p className="text-2xl font-bold">{c.valor}</p>
            <p className="mt-1 text-sm text-muted">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 border-t border-line pt-8">
        <h2 className="font-bold">Fluxo de trabalho</h2>
        <ol className="mt-4 space-y-3">
          {[
            ["1", "Conecte seus canais", "/canais"],
            ["2", "Cadastre suas lojas com link de afiliado", "/lojas"],
            ["3", "Cole o link do produto e importe", "/produtos/importar"],
            ["4", "Selecione os canais e poste tudo de uma vez", "/postar"],
          ].map(([n, texto, href]) => (
            <li key={n}>
              <Link href={href} className="flex items-center justify-between rounded-md border border-line px-4 py-3 hover:border-ink">
                <span className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper">
                    {n}
                  </span>
                  <span className="text-sm">{texto}</span>
                </span>
                <ArrowRight size={16} className="text-muted" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
