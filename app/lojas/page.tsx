"use client";

import { useState } from "react";
import { useApp } from "@/components/store";
import { Plus, ChevronDown, Check } from "lucide-react";

function CampoMolde({
  valorInicial,
  onSalvar,
}: {
  valorInicial: string;
  onSalvar: (valor: string) => void;
}) {
  const [valor, setValor] = useState(valorInicial);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    setSalvando(true);
    await onSalvar(valor.trim());
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1500);
  }

  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      <p className="text-xs text-muted">
        Dois formatos aceitos: se sua loja gera um link de redirecionamento (Shopee, Shein), cole ele e
        troque a parte do link do produto por <code className="rounded bg-line/60 px-1">{"{PRODUTO}"}</code>.
        Se sua loja só pede um parâmetro no próprio link (Mercado Livre, Amazon), cole só a parte depois do
        "?" — ex.: <code className="rounded bg-line/60 px-1">?tag=seunome-20</code>.
      </p>
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Molde do link de afiliado dessa loja"
        className="w-full rounded-md border border-line px-3 py-2 text-xs outline-none focus:border-cobalt"
      />
      <button
        onClick={salvar}
        disabled={salvando}
        className="flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-paper disabled:opacity-50"
      >
        {salvo ? (
          <>
            <Check size={13} /> Salvo
          </>
        ) : salvando ? (
          "Salvando…"
        ) : (
          "Salvar molde"
        )}
      </button>
    </div>
  );
}

export default function Lojas() {
  const { lojas, adicionarLoja, editarLoja } = useApp();
  const [expandida, setExpandida] = useState<string | null>(null);
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
      <p className="mt-1 text-muted">
        Lojas onde você tem link de afiliado. Toque numa loja pra cadastrar o molde do seu link — assim
        todo produto importado dela já sai com seu link de afiliado aplicado.
      </p>

      <div className="mt-8 divide-y divide-line border-y border-line">
        {lojas.map((loja) => {
          const expandido = expandida === loja.id;
          return (
            <div key={loja.id} className="py-4">
              <button
                onClick={() => setExpandida(expandido ? null : loja.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-semibold">{loja.nome}</p>
                  <p className="text-xs text-muted">
                    {loja.templateLink ? "Molde de afiliado configurado" : "Sem molde de afiliado ainda"}
                  </p>
                </div>
                <ChevronDown size={16} className={`text-muted transition-transform ${expandido ? "rotate-180" : ""}`} />
              </button>

              {expandido && (
                <CampoMolde
                  valorInicial={loja.templateLink ?? ""}
                  onSalvar={(valor) => editarLoja(loja.id, valor)}
                />
              )}
            </div>
          );
        })}
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
            <label className="text-xs font-semibold text-muted">Molde do link de afiliado (opcional, dá pra configurar depois)</label>
            <input
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Ex.: ?tag=seunome-20 ou um link com {PRODUTO}"
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
