"use client";

import { useState } from "react";
import { useApp } from "@/components/store";
import { Plus } from "lucide-react";

export default function Lojas() {
  const { lojas, adicionarLoja } = useApp();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [template, setTemplate] = useState("");

  function salvar() {
    if (!nome.trim()) return;
    adicionarLoja(nome.trim(), template.trim());
    setNome("");
    setTemplate("");
    setAberto(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Lojas</h1>
      <p className="mt-1 text-muted">Lojas onde você tem link de afiliado. Cole o link do produto na tela de Importar.</p>

      <div className="mt-8 divide-y divide-line border-y border-line">
        {lojas.map((loja) => (
          <div key={loja.id} className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold">{loja.nome}</p>
              <p className="text-xs text-muted">{loja.padrao ? "Loja padrão" : "Loja adicionada por você"}</p>
            </div>
          </div>
        ))}
      </div>

      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="mt-6 flex items-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm font-semibold hover:border-ink"
        >
          <Plus size={16} /> Adicionar loja
        </button>
      ) : (
        <div className="mt-6 space-y-3 rounded-md border border-line p-4">
          <div>
            <label className="text-xs font-semibold text-muted">Nome da loja</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: AliExpress"
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-cobalt"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">Modelo do link de afiliado (opcional)</label>
            <input
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Cole aqui um exemplo de link de afiliado dessa loja"
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-cobalt"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={salvar} className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper">
              Salvar loja
            </button>
            <button onClick={() => setAberto(false)} className="rounded-md px-4 py-2 text-sm text-muted">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
