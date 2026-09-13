"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    });
    setCarregando(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setErro(data.erro ?? "Não foi possível entrar");
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-xs">
      <h1 className="text-xl font-bold">Área admin</h1>
      <p className="mt-1 text-sm text-muted">Acesso restrito para testar a conexão das APIs.</p>
      <form onSubmit={entrar} className="mt-6 space-y-3">
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha de admin"
          autoFocus
          className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-cobalt"
        />
        {erro && <p className="text-xs text-coral">{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-md bg-ink py-2 text-sm font-semibold text-paper disabled:opacity-50"
        >
          {carregando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
