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

function formatarPreco(valor: number, moeda?: string) {
  const simbolo = moeda === "USD" ? "US$" : moeda === "ARS" ? "AR$" : "R$";
  return `${simbolo} ${valor.toFixed(2)}`;
}

function extrairIdML(url: string): string | null {
  const match = url.match(/MLB-?(\d{6,})/i);
  return match ? `MLB${match[1]}` : null;
}

// Tenta primeiro como "item" (anúncio de um vendedor). Se não achar (por exemplo,
// o link é de uma página de "produto" do catálogo, que reúne vários vendedores),
// tenta como "product" e pega o menor preço entre os vendedores disponíveis.
export async function buscarProdutoMercadoLivre(linkFinal: string): Promise<ProdutoEncontrado | null> {
  const id = extrairIdML(linkFinal);
  if (!id) return null;

  const resItem = await fetch(`https://api.mercadolibre.com/items/${id}`);
  if (resItem.ok) {
    const item = await resItem.json();
    let preco = item.price;

    // Item com variações (tamanho, cor etc.) às vezes não tem preço no nível principal.
    if (!preco && Array.isArray(item.variations) && item.variations.length > 0) {
      preco = item.variations.find((v: any) => v.price)?.price;
    }

    return {
      nome: item.title,
      imagemUrl: item.thumbnail?.replace(/^http:/, "https:") || item.pictures?.[0]?.url,
      precoTexto: preco ? formatarPreco(preco, item.currency_id) : undefined,
      videoIdYoutube: item.video_id || undefined,
    };
  }

  const resProduto = await fetch(`https://api.mercadolibre.com/products/${id}`);
  if (resProduto.ok) {
    const produto = await resProduto.json();
    const menorPreco = produto.buy_box_winner?.price;
    return {
      nome: produto.name,
      imagemUrl: produto.pictures?.[0]?.url,
      precoTexto: menorPreco ? formatarPreco(menorPreco, produto.buy_box_winner?.currency_id) : undefined,
    };
  }

  return null;
}

// Fallback genérico pra lojas sem API de afiliado aberta (Shopee, Amazon, Shein):
// primeiro tenta o JSON-LD (dados estruturados que a maioria das lojas embute na
// página pra aparecer no Google Shopping — costuma trazer preço certo), e só
// depois cai pras tags Open Graph (que geralmente não têm preço).
// Nem toda loja libera isso pra requisições de servidor (a Amazon em particular
// costuma bloquear).
export async function buscarProdutoPorMetaTags(linkFinal: string): Promise<ProdutoEncontrado | null> {
  try {
    const res = await fetch(linkFinal, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const doJsonLd = extrairProdutoJsonLd(html);

    const pegarMeta = (prop: string) => {
      const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"));
      return m?.[1];
    };

    const nome = doJsonLd?.nome || pegarMeta("og:title");
    if (!nome) return null;

    const precoJsonLd = doJsonLd?.preco;
    const precoMeta = pegarMeta("product:price:amount") || pegarMeta("og:price:amount");
    const moedaMeta = pegarMeta("product:price:currency") || pegarMeta("og:price:currency");

    return {
      nome,
      imagemUrl: doJsonLd?.imagemUrl || pegarMeta("og:image"),
      precoTexto:
        precoJsonLd ??
        (precoMeta ? formatarPreco(parseFloat(precoMeta.replace(",", ".")), moedaMeta) : undefined),
    };
  } catch {
    return null;
  }
}

// Procura um bloco <script type="application/ld+json"> com schema.org Product e
// devolve nome, imagem e preço já formatado, se encontrar.
function extrairProdutoJsonLd(html: string): { nome?: string; imagemUrl?: string; preco?: string } | null {
  const blocos = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const bloco of blocos) {
    try {
      const dados = JSON.parse(bloco[1].trim());
      const candidatos = Array.isArray(dados) ? dados : dados["@graph"] ?? [dados];

      for (const item of candidatos) {
        const tipo = Array.isArray(item?.["@type"]) ? item["@type"] : [item?.["@type"]];
        if (!tipo.includes("Product")) continue;

        const oferta = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        const preco = oferta?.price ?? oferta?.lowPrice;
        const imagem = Array.isArray(item.image) ? item.image[0] : item.image;

        return {
          nome: item.name,
          imagemUrl: imagem,
          preco: preco ? formatarPreco(parseFloat(preco), oferta?.priceCurrency) : undefined,
        };
      }
    } catch {
      // bloco de JSON-LD mal formado ou de outro tipo (ex.: BreadcrumbList) — ignora e segue
      continue;
    }
  }

  return null;
}
