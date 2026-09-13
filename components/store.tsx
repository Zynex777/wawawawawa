"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Canal, Loja, Video, Postagem } from "@/lib/types";
import { canaisIniciais, lojasIniciais, videosIniciais, postagensIniciais } from "@/lib/mock-data";

type AppState = {
  canais: Canal[];
  lojas: Loja[];
  videos: Video[];
  postagens: Postagem[];
  toggleCanal: (id: string) => void;
  adicionarLoja: (nome: string, templateLink: string) => void;
  adicionarVideo: (v: Omit<Video, "id" | "criadoEm">) => Video;
  postarEm: (videoId: string, canalIds: string[]) => void;
};

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEY = "afiliado-multipost-state-v1";

function load() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const saved = typeof window !== "undefined" ? load() : null;

  const [canais, setCanais] = useState<Canal[]>(saved?.canais ?? canaisIniciais);
  const [lojas, setLojas] = useState<Loja[]>(saved?.lojas ?? lojasIniciais);
  const [videos, setVideos] = useState<Video[]>(saved?.videos ?? videosIniciais);
  const [postagens, setPostagens] = useState<Postagem[]>(saved?.postagens ?? postagensIniciais);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ canais, lojas, videos, postagens })
    );
  }, [canais, lojas, videos, postagens]);

  function toggleCanal(id: string) {
    setCanais((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, conectado: !c.conectado, contaConectada: !c.conectado ? "@minha_conta" : undefined }
          : c
      )
    );
  }

  function adicionarLoja(nome: string, templateLink: string) {
    setLojas((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, nome, padrao: false, templateLink },
    ]);
  }

  function adicionarVideo(v: Omit<Video, "id" | "criadoEm">) {
    const novo: Video = { ...v, id: `video-${Date.now()}`, criadoEm: new Date().toISOString() };
    setVideos((prev) => [novo, ...prev]);
    return novo;
  }

  function postarEm(videoId: string, canalIds: string[]) {
    const novas: Postagem[] = canalIds.map((canalId) => {
      const canal = canais.find((c) => c.id === canalId);
      const automatico = canal?.suporte === "automatico";
      return {
        id: `post-${Date.now()}-${canalId}`,
        videoId,
        canalId,
        status: automatico ? "publicado" : "manual",
        dataAgendada: new Date().toISOString(),
        dataPostada: automatico ? new Date().toISOString() : undefined,
      };
    });
    setPostagens((prev) => [...novas, ...prev]);
  }

  return (
    <AppContext.Provider
      value={{ canais, lojas, videos, postagens, toggleCanal, adicionarLoja, adicionarVideo, postarEm }}
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
