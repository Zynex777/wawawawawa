"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/store";
import { Upload, Link as LinkIcon } from "lucide-react";

function detectarLoja(link: string, lojas: { id: string; nome: string }[]) {
  const l = link.toLowerCase();
  if (l.includes("mercadolivre") || l.includes("mercadolibre")) return lojas.find((x) => x.id === "ml");
  if (l.includes("shopee")) return lojas.find((x) => x.id === "shopee");
  if (l.includes("amazon")) return lojas.find((x) => x.id === "amazon");
  if (l.includes("shein")) return lojas.find((x) => x.id === "shein");
  return undefined;
}

export default function ImportarProduto() {
  const { lojas, adicionarVideo } = useApp();
  const router = useRouter();
  const [link, setLink] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [encontrado, setEncontrado] = useState<null | { nome: string; lojaNome: string; temVideo: boolean }>(null);
  const [arquivoGaleria, setArquivoGaleria] = useState<File | null>(null);
  const [legenda, setLegenda] = useState("");

  function importar() {
    if (!link.trim()) return;
    setCarregando(true);
    setEncontrado(null);
    // Em produção: chamada à API oficial de cada marketplace para nome/preço/imagem/vídeo.
    setTimeout(() => {
      const loja = detectarLoja(link, lojas);
      const temVideoAutomatico = loja?.id === "ml"; // só ML traz vídeo automático via API pública
      setEncontrado({
        nome: "Produto importado do link colado",
        lojaNome: loja?.nome ?? "Loja não reconhecida (cadastre em Lojas)",
        temVideo: temVideoAutomatico,
      });
      setLegenda("Confira essa oferta 🔥 link na bio");
      setCarregando(false);
    }, 900);
  }

  function finalizar() {
    if (!encontrado) return;
    const loja = detectarLoja(link, lojas);
    adicionarVideo({
      produtoNome: encontrado.nome,
      lojaId: loja?.id ?? "outra",
      origem: encontrado.temVideo ? "automatico" : arquivoGaleria ? "galeria" : "automatico",
      urlThumb: "",
      legenda,
      linkAfiliado: link,
    });
    router.push("/videos");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Importar produto</h1>
      <p className="mt-1 text-muted">Cole o link de afiliado do produto. O sistema busca nome, preço, imagem e vídeo automaticamente quando possível.</p>

      <div className="mt-8 flex gap-2">
        <div className="relative flex-1">
          <LinkIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Cole o link do produto aqui"
            className="w-full rounded-md border border-line py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cobalt"
          />
        </div>
        <button
          onClick={importar}
          disabled={carregando}
          className="rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper disabled:opacity-50"
        >
          {carregando ? "Buscando…" : "Importar"}
        </button>
      </div>

      {encontrado && (
        <div className="mt-8 space-y-5 rounded-md border border-line p-4">
          <div>
            <p className="text-sm font-semibold">{encontrado.nome}</p>
            <p className="text-xs text-muted">{encontrado.lojaNome}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted">Legenda</label>
            <textarea
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-cobalt"
            />
          </div>

          {encontrado.temVideo ? (
            <div className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">
              Vídeo do produto importado automaticamente. Fica como rascunho pra você revisar.
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-muted">
                Essa loja ainda não tem vídeo automático — envie um vídeo da sua galeria
              </label>
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-line py-6 text-sm text-muted hover:border-ink">
                <Upload size={16} />
                {arquivoGaleria ? arquivoGaleria.name : "Escolher vídeo da galeria"}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setArquivoGaleria(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          <button onClick={finalizar} className="rounded-md bg-cobalt px-4 py-2 text-sm font-semibold text-paper">
            Salvar no banco de vídeos
          </button>
        </div>
      )}
    </div>
  );
}
