"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Canal, Loja, Video, Postagem } from "@/lib/types";

type AppState = {
  canais: Canal[];
  lojas: Loja[];
  videos: Video[];
  postagens: Postagem[];
  carregando: boolean;
  toggleCanal: (id: string) => Promise<void>;
  adicionarLoja: (nome: string, templateLink: string) => Promise<void>;
  editarLoja: (id: string, templateLink: string) => Promise<void>;
  adicionarVideo: (v: {
    produtoNome: string;
    lojaId: string;
    origem: "automatico" | "galeria";
    legenda?: string;
    linkAfiliado: string;
    urlArquivo?: string;
  }) => Promise<Video>;
  postarEm: (videoId: string, canalIds: string[]) => Promise<void>;
  marcarPostagem: (id: string, status: "publicado" | "falhou") => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

async function buscar<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`);
  return res.json();
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [canais, setCanais] = useState<Canal[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [postagens, setPostagens] = useState<Postagem[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarTudo = useCallback(async () => {
    setCarregando(true);
    try {
      const [c, l, v, p] = await Promise.all([
        buscar<Canal[]>("/api/canais"),
        buscar<Loja[]>("/api/lojas"),
        buscar<Video[]>("/api/videos"),
        buscar<Postagem[]>("/api/postagens"),
      ]);
      setCanais(c);
      setLojas(l);
      setVideos(v);
      setPostagens(p);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  async function toggleCanal(id: string) {
    const res = await fetch(`/api/canais/${id}`, { method: "PATCH" });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.erro ?? `Erro ${res.status} ao conectar`);
    }
    const atualizado = await res.json();
    setCanais((prev) => prev.map((c) => (c.id === id ? atualizado : c)));
  }

  async function adicionarLoja(nome: string, templateLink: string) {
    const res = await fetch("/api/lojas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, templateLink }),
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.erro ?? `Erro ${res.status} ao adicionar loja`);
    }
    const nova = await res.json();
    setLojas((prev) => [...prev, nova]);
  }

  async function adicionarVideo(v: {
    produtoNome: string;
    lojaId: string;
    origem: "automatico" | "galeria";
    legenda?: string;
    linkAfiliado: string;
    urlArquivo?: string;
  }) {
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.erro ?? `Erro ${res.status} ao salvar vídeo`);
    }
    const novo = await res.json();
    setVideos((prev) => [novo, ...prev]);
    return novo as Video;
  }

  async function postarEm(videoId: string, canalIds: string[]) {
    const res = await fetch("/api/postagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, canalIds }),
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.erro ?? `Erro ${res.status} ao postar`);
    }
    const novas = await res.json();
    setPostagens((prev) => [...novas, ...prev]);
  }

  async function editarLoja(id: string, templateLink: string) {
    const res = await fetch(`/api/lojas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateLink }),
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.erro ?? `Erro ${res.status} ao salvar loja`);
    }
    const atualizada = await res.json();
    setLojas((prev) => prev.map((l) => (l.id === id ? atualizada : l)));
  }

  async function marcarPostagem(id: string, status: "publicado" | "falhou") {
    const res = await fetch(`/api/postagens/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.erro ?? `Erro ${res.status} ao atualizar postagem`);
    }
    const atualizada = await res.json();
    setPostagens((prev) => prev.map((p) => (p.id === id ? atualizada : p)));
  }

  return (
    <AppContext.Provider
      value={{
        canais,
        lojas,
        videos,
        postagens,
        carregando,
        toggleCanal,
        adicionarLoja,
        editarLoja,
        adicionarVideo,
        postarEm,
        marcarPostagem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp precisa estar dentro de <AppProvider>");
  return ctx;
}
