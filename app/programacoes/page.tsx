"use client";

import { useEffect, useState } from "react";
import { nomeCanal } from "@/lib/canais-meta";

type Canal = { id: string; rede: string; conectado: boolean; suporte: string };
type Prog = {
  id: string;
  modo: string;
  periodo: string;
  redes: string;
  horarios: string;
  aprovacao: boolean;
  criadoEm: string;
  aguardandoAprovacao: number;
  agendadas: number;
  pausadas: number;
  publicadas: number;
  falhas: number;
};

const PERIODOS = [
  { v: "hoje", t: "Hoje" },
  { v: "amanha", t: "Amanhã" },
  { v: "semana", t: "Esta semana" },
  { v: "dias", t: "Próximos dias" },
  { v: "todos", t: "Todos os dias (30 dias, renovado)" },
];
const MODOS = [
  { v: "novos", t: "Publicar produtos novos" },
  { v: "republicar", t: "Republicar (produto com 20+ dias)" },
  { v: "alternar", t: "Alternar novos e republicações" },
];

export default function Programacoes() {
  const [canais, setCanais] = useState<Canal[]>([]);
  const [progs, setProgs] = useState<Prog[]>([]);
  const [redes, setRedes] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState("amanha");
  const [dias, setDias] = useState(2);
  const [horarios, setHorarios] = useState("10:00, 19:00");
  const [modo, setModo] = useState("novos");
  const [aprovacao, setAprovacao] = useState(true);
  const [resumo, setResumo] = useState<any>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    const [c, p] = await Promise.all([fetch("/api/canais").then((r) => r.json()), fetch("/api/programacoes").then((r) => r.json())]);
    setCanais(c.filter((x: Canal) => x.conectado && x.suporte === "automatico"));
    setProgs(p);
  }
  useEffect(() => { carregar(); }, []);

  function alternarRede(rede: string) {
    setRedes((prev) => (prev.includes(rede) ? prev.filter((r) => r !== rede) : [...prev, rede]));
  }

  async function criar() {
    setErro("");
    setResumo(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/programacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redes,
          periodo,
          dias,
          modo,
          aprovacao,
          horarios: horarios.split(",").map((h) => h.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Falha ao criar a programação");
      setResumo(data);
      carregar();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function acao(id: string, a: string) {
    await fetch(`/api/programacoes/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: a }),
    });
    carregar();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Agenda</h1>
      <p className="mt-1 text-muted">
        Escolhe as redes, o período e os horários. O app gera os textos e as publicações, e você aprova antes de
        sair. Nada é publicado enquanto não for aprovado.
      </p>

      <div className="mt-6 space-y-5 rounded-md border border-line p-4">
        <div>
          <p className="text-xs font-semibold text-muted">Redes</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {canais.length === 0 && <p className="text-xs text-muted">Nenhuma rede automática conectada ainda.</p>}
            {canais.map((c) => (
              <button
                key={c.id}
                onClick={() => alternarRede(c.rede)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                  redes.includes(c.rede) ? "border-cobalt bg-cobalt text-paper" : "border-line"
                }`}
              >
                {nomeCanal(c.rede)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted">Quando deseja publicar?</label>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm">
            {PERIODOS.map((p) => <option key={p.v} value={p.v}>{p.t}</option>)}
          </select>
          {periodo === "dias" && (
            <input type="number" min={2} max={30} value={dias} onChange={(e) => setDias(Number(e.target.value))} className="mt-2 w-24 rounded-md border border-line px-3 py-2 text-sm" />
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted">Horários (separados por vírgula, fuso de São Paulo)</label>
          <input value={horarios} onChange={(e) => setHorarios(e.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted">Produtos</label>
          <select value={modo} onChange={(e) => setModo(e.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm">
            {MODOS.map((m) => <option key={m.v} value={m.v}>{m.t}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={aprovacao} onChange={(e) => setAprovacao(e.target.checked)} />
          Aprovar antes de publicar (recomendado)
        </label>

        {erro && <p className="rounded-md bg-coral/10 px-3 py-2 text-xs text-coral">{erro}</p>}

        <button onClick={criar} disabled={enviando || redes.length === 0} className="w-full rounded-md bg-ink py-2.5 text-sm font-semibold text-paper disabled:opacity-40">
          {enviando ? "Gerando…" : "Gerar programação"}
        </button>
      </div>

      {resumo && (
        <div className="mt-6 space-y-2 rounded-md border border-cobalt/40 bg-cobalt/5 p-4 text-sm">
          <p className="font-semibold">Programação criada: {resumo.totalPublicacoes} publicações</p>
          <p className="text-xs text-muted">
            {resumo.aguardandoAprovacao ? "Aguardando sua aprovação na lista abaixo." : "Já agendada."}
            {resumo.lacunas > 0 ? ` ${resumo.lacunas} horário(s) ficaram sem produto disponível.` : ""}
          </p>
          {Object.entries(resumo.porRede as Record<string, number>).map(([rede, n]) => (
            <p key={rede} className="text-xs">{nomeCanal(rede)}: {n} publicações</p>
          ))}
          {resumo.previas?.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted">Prévia de textos</p>
              {resumo.previas.map((p: any, i: number) => (
                <pre key={i} className="mt-1 whitespace-pre-wrap rounded-md bg-white p-2 text-xs">{p.texto}</pre>
              ))}
            </div>
          )}
        </div>
      )}

      <h2 className="mt-10 font-bold">Programações</h2>
      {progs.length === 0 && <p className="mt-2 text-sm text-muted">Nenhuma programação ainda.</p>}
      <div className="mt-3 divide-y divide-line border-y border-line">
        {progs.map((p) => (
          <div key={p.id} className="space-y-2 py-4">
            <p className="text-sm font-semibold">
              {p.redes.split(",").map((r) => nomeCanal(r)).join(", ")}
            </p>
            <p className="text-xs text-muted">
              {p.horarios} · {p.modo} · {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-xs">
              Aguardando aprovação: {p.aguardandoAprovacao} · Agendadas: {p.agendadas} · Pausadas: {p.pausadas} · Publicadas: {p.publicadas} · Falhas: {p.falhas}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {p.aguardandoAprovacao > 0 && (
                <button onClick={() => acao(p.id, "aprovar")} className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-paper">Aprovar</button>
              )}
              {p.agendadas > 0 && (
                <button onClick={() => acao(p.id, "pausar")} className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold">Pausar</button>
              )}
              {p.pausadas > 0 && (
                <button onClick={() => acao(p.id, "retomar")} className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold">Retomar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
