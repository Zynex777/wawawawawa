export type LojaDetectada = "mercadolivre" | "shopee" | "amazon" | "shein" | null;

export function detectarLojaPorUrl(url: string): LojaDetectada {
  const host = url.toLowerCase();
  if (host.includes("mercadolivre") || host.includes("mercadolibre")) return "mercadolivre";
  if (host.includes("shopee")) return "shopee";
  if (host.includes("amazon") || host.includes("amzn.to")) return "amazon";
  if (host.includes("shein")) return "shein";
  return null;
}

// Segue redirecionamentos (comum em link de afiliado encurtado) e devolve a URL final.
export async function resolverLinkFinal(link: string): Promise<string> {
  try {
    const res = await fetch(link, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" } });
    return res.url || link;
  } catch {
    return link;
  }
}

export type ProdutoEncontrado = {
  nome: string;
  imagemUrl?: string;
  precoTexto?: string;
  videoIdYoutube?: string; // quando a própria loja já tem um vídeo vinculado ao anúncio
};

function extrairIdML(url: string): string | null {
  const match = url.match(/MLB-?(\d{6,})/i);
  return match ? `MLB${match[1]}` : null;
}

export async function buscarProdutoMercadoLivre(linkFinal: string): Promise<ProdutoEncontrado | null> {
  const id = extrairIdML(linkFinal);
  if (!id) return null;

  const res = await fetch(`https://api.mercadolibre.com/items/${id}`);
  if (!res.ok) return null;
  const item = await res.json();

  return {
    nome: item.title,
    imagemUrl: item.thumbnail || item.pictures?.[0]?.url,
    precoTexto: item.price ? `R$ ${Number(item.price).toFixed(2)}` : undefined,
    videoIdYoutube: item.video_id || undefined,
  };
}

// Fallback genérico pra lojas sem API de afiliado aberta (Shopee, Amazon, Shein):
// lê as tags Open Graph da própria página do produto. Nem toda loja libera isso
// pra requisições de servidor (a Amazon em particular costuma bloquear).
export async function buscarProdutoPorMetaTags(linkFinal: string): Promise<ProdutoEncontrado | null> {
  try {
    const res = await fetch(linkFinal, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const pegar = (prop: string) => {
      const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"));
      return m?.[1];
    };

    const nome = pegar("og:title");
    if (!nome) return null;

    return {
      nome,
      imagemUrl: pegar("og:image"),
    };
  } catch {
    return null;
  }
}
