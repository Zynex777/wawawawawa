"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Canal = {
  id: string;
  rede: string;
  suporte: string;
  conectado: boolean;
  contaConectada: string | null;
  accessToken: string | null;
  refreshToken: string | null;
};

const NOMES: Record<string, string> = {
  tiktok: "TikTok",
  kwai: "Kwai",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  mercadolivre: "Mercado Livre",
};

// Redes com login OAuth de verdade implementado. Pra não sobrescrever sem
// querer o token real dessas contas, o admin não edita mais elas aqui —
// a única forma de conectar/reconectar é pelo botão "Conectar" da tela Canais.
const REDES_BLOQUEADAS = ["facebook", "mercadolivre"];

export default function AdminPainel() {
  const router = useRouter();
  const [canais, setCanais] = useState<Canal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/canais")
      .then(async (r) => {
        if (!r.ok) {
          const corpo = await r.json().catch(() => ({}));
          throw new Error(corpo.erro ?? `Erro ${r.status} ao buscar os canais`);
        }
        return r.json();
      })
      .then((data) => setCanais(data))
      .catch((e) => setErroCarregar(e.message ?? "Falha ao carregar os canais"))
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(canal: Canal, campos: Partial<Canal>) {
    setSalvandoId(canal.id);
    const res = await fetch(`/api/admin/canais/${canal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campos),
    });
    setSalvandoId(null);
    if (res.ok) {
      const atualizado = await res.json();
      setCanais((prev) => prev.map((c) => (c.id === canal.id ? atualizado : c)));
      setMensagem((m) => ({ ...m, [canal.id]: "Credenciais salvas para teste." }));
    } else {
      setMensagem((m) => ({ ...m, [canal.id]: "Não foi possível salvar." }));
    }
  }

  async function sair() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>;

  if (erroCarregar) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Admin · Teste de APIs</h1>
        <div className="mt-6 rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
          Não deu pra carregar os canais: {erroCarregar}
        </div>
        <p className="mt-3 text-xs text-muted">
          Confira se a variável DATABASE_URL está certa nas configurações do Vercel e se o redeploy já foi
          feito depois de adicioná-la.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin · Teste de APIs</h1>
        <button onClick={sair} className="text-xs font-semibold text-muted">
          Sair
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        Cole aqui as credenciais de cada rede pra testar a conexão antes de deixar automático pros
        usuários. Isso não afeta o app enquanto a integração real dessa rede não estiver implementada.
      </p>

      <div className="mt-8 space-y-5">
        {canais.map((canal) => (
          <CanalCard
            key={canal.id}
            canal={canal}
            nome={NOMES[canal.rede] ?? canal.rede}
            bloqueado={REDES_BLOQUEADAS.includes(canal.rede)}
            salvando={salvandoId === canal.id}
            mensagem={mensagem[canal.id]}
            onSalvar={(campos) => salvar(canal, campos)}
          />
        ))}
      </div>
    </div>
  );
}

function CanalCard({
  canal,
  nome,
  bloqueado,
  salvando,
  mensagem,
  onSalvar,
}: {
  canal: Canal;
  nome: string;
  bloqueado: boolean;
  salvando: boolean;
  mensagem?: string;
  onSalvar: (campos: Partial<Canal>) => void;
}) {
  const [accessToken, setAccessToken] = useState(canal.accessToken ?? "");
  const [refreshToken, setRefreshToken] = useState(canal.refreshToken ?? "");
  const [conta, setConta] = useState(canal.contaConectada ?? "");

  if (bloqueado) {
    return (
      <div className="rounded-md border border-line p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{nome}</p>
          <span className="text-xs text-muted">
            {canal.conectado ? `conectado · ${canal.contaConectada ?? ""}` : "desconectado"}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">
          Essa rede já tem login de verdade — pra não sobrescrever o token real por engano, só dá pra
          conectar ou reconectar pelo botão "Conectar" na tela Canais do app.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-line p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{nome}</p>
        <span className="text-xs text-muted">
          {canal.suporte === "automatico" ? "API oficial" : "sem API pública"} ·{" "}
          {canal.conectado ? "conectado" : "desconectado"}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <input
          value={conta}
          onChange={(e) => setConta(e.target.value)}
          placeholder="Conta conectada (ex.: @minha_loja)"
          className="w-full rounded-md border border-line px-3 py-2 text-xs outline-none focus:border-cobalt"
        />
        <input
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="Access token de teste"
          className="w-full rounded-md border border-line px-3 py-2 text-xs outline-none focus:border-cobalt"
        />
        <input
          value={refreshToken}
          onChange={(e) => setRefreshToken(e.target.value)}
          placeholder="Refresh token de teste (opcional)"
          className="w-full rounded-md border border-line px-3 py-2 text-xs outline-none focus:border-cobalt"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() =>
            onSalvar({
              contaConectada: conta,
              accessToken,
              refreshToken,
              conectado: Boolean(accessToken),
            })
          }
          disabled={salvando}
          className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-paper disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar credenciais de teste"}
        </button>
        {mensagem && <span className="text-xs text-muted">{mensagem}</span>}
      </div>
    </div>
  );
}
