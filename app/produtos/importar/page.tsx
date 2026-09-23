"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/store";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Upload, Link as LinkIcon } from "lucide-react";

const NOME_LOJA: Record<string, string> = {
  mercadolivre: "Mercado Livre",
  shopee: "Shopee",
  amazon: "Amazon",
  shein: "Shein",
};

type Resultado = {
  loja: string | null;
  encontrado: boolean;
  manual: boolean;
  nome?: string;
  imagemUrl?: string;
  precoTexto?: string;
  videoIdYoutube?: string;
  aviso?: string;
};

export default function ImportarProduto() {
  const { lojas, adicionarVideo } = useApp();
  const router = useRouter();
  const [link, setLink] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [nomeManual, setNomeManual] = useState("");
  const [arquivoGaleria, setArquivoGaleria] = useState<File | null>(null);
  const [legenda, setLegenda] = useState("Confira essa oferta 🔥");
  const [salvando, setSalvando] = useState(false);
  const [statusUpload, setStatusUpload] = useState("");

  async function enviarVideoGaleria(arquivoOriginal: File): Promise<string> {
    let arquivo = arquivoOriginal;
    const LIMITE_SUPABASE = 50 * 1024 * 1024;

    if (arquivoOriginal.size > 500 * 1024 * 1024) {
      throw new Error(
        "Esse vídeo tem mais de 500MB — muito grande pro celular processar no navegador. Corta ou reduz a " +
          "resolução dele num editor de vídeo do celular antes de enviar (um vídeo de produto de 15-30 " +
          "segundos costuma ficar bem menor que isso)."
      );
    }

    if (arquivoOriginal.size >= 20 * 1024 * 1024) {
      try {
        setStatusUpload("Compactando vídeo… 0%");
        const { comprimirVideo } = await import("@/lib/comprimir-video");
        arquivo = await comprimirVideo(arquivoOriginal, (pct) => setStatusUpload(`Compactando vídeo… ${pct}%`));
      } catch {
        arquivo = arquivoOriginal;
      }

      if (arquivo.size > LIMITE_SUPABASE) {
        throw new Error(
          "Não consegui deixar esse vídeo pequeno o suficiente (limite é 50MB). Tenta um vídeo mais curto " +
            "ou já reduzido antes de enviar."
        );
      }
    }

    setStatusUpload("Enviando vídeo…");
    const resAssinatura = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeArquivo: arquivo.name }),
    });
    if (!resAssinatura.ok) {
      const erro = await resAssinatura.json().catch(() => ({}));
      throw new Error(erro.erro ?? "Falha ao preparar o envio do vídeo");
    }
    const { caminho, token } = await resAssinatura.json();

    const supabase = supabaseBrowser();
    const { error } = await supabase.storage.from("videos").uploadToSignedUrl(caminho, token, arquivo);
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("videos").getPublicUrl(caminho);
    setStatusUpload("");
    return data.publicUrl;
  }

  async function importar() {
    if (!link.trim()) return;
    setCarregando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/produtos/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link }),
      });
      const data: Resultado = await res.json();
      setResultado(data);
      setNomeManual(data.nome ?? "");
    } catch {
      setResultado({ loja: null, encontrado: false, manual: true, aviso: "Falha ao buscar o link." });
    } finally {
      setCarregando(false);
    }
  }

  function encontrarLoja() {
    if (!resultado?.loja) return undefined;
    const nomeAlvo = NOME_LOJA[resultado.loja];
    return lojas.find((l) => l.nome.toLowerCase() === nomeAlvo?.toLowerCase());
  }

  async function finalizar() {
    if (!resultado) return;
    const nomeFinal = (resultado.manual ? nomeManual : resultado.nome ?? nomeManual).trim();
    if (!nomeFinal) {
      alert("Digite o nome do produto.");
      return;
    }
    const loja = encontrarLoja();
    if (!loja) {
      alert("Não reconheci a loja desse link. Cadastre essa loja em Lojas antes de importar.");
      return;
    }

    setSalvando(true);
    let urlArquivo: string | undefined;
    if (arquivoGaleria) {
      try {
        urlArquivo = await enviarVideoGaleria(arquivoGaleria);
      } catch (e: any) {
        setSalvando(false);
        setStatusUpload("");
        alert(e.message ?? "Falha ao enviar o vídeo. Tente de novo.");
        return;
      }
    }

    try {
      await adicionarVideo({
        produtoNome: nomeFinal,
        lojaId: loja.id,
        origem: resultado.videoIdYoutube ? "automatico" : arquivoGaleria ? "galeria" : "automatico",
        legenda,
        linkAfiliado: link,
        urlArquivo,
      });
      router.push("/videos");
    } catch (e: any) {
      alert(e.message ?? "Falha ao salvar o vídeo. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Importar produto</h1>
      <p className="mt-1 text-muted">
        Cole o link de afiliado do produto. Busco nome, preço e imagem de verdade quando a loja libera;
        senão, você confirma o nome na mão.
      </p>

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

      {resultado && (
        <div className="mt-8 space-y-5 rounded-md border border-line p-4">
          {resultado.aviso && (
            <div className="rounded-md bg-cobalt/10 px-3 py-2 text-xs text-cobalt">{resultado.aviso}</div>
          )}

          <div className="flex gap-3">
            {resultado.imagemUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resultado.imagemUrl} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
            )}
            <div className="flex-1">
              {resultado.manual ? (
                <input
                  value={nomeManual}
                  onChange={(e) => setNomeManual(e.target.value)}
                  placeholder="Nome do produto"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-cobalt"
                />
              ) : (
                <p className="text-sm font-semibold">{resultado.nome}</p>
              )}
              <p className="mt-1 text-xs text-muted">
                {resultado.loja ? NOME_LOJA[resultado.loja] : "Loja não reconhecida"}
                {resultado.precoTexto ? ` · ${resultado.precoTexto}` : ""}
              </p>
            </div>
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

          {resultado.videoIdYoutube ? (
            <div className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">
              Esse anúncio já tem um vídeo vinculado — importado automaticamente.
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-muted">
                Esse produto ainda não tem vídeo automático — envie um vídeo da sua galeria
              </label>
              <p className="mt-0.5 text-xs text-muted">
                Vídeos grandes são compactados automaticamente antes de enviar (pode levar um tempinho).
              </p>
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

          <button
            onClick={finalizar}
            disabled={salvando}
            className="rounded-md bg-cobalt px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
          >
            {statusUpload || (salvando ? "Salvando…" : "Salvar no banco de vídeos")}
          </button>
        </div>
      )}
    </div>
  );
}
