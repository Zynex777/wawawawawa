// Dados detalhados do produto. Guardado como JSON no banco (coluna detalhes).
export type DetalhesProduto = {
  imagemUrl?: string;
  precoTexto?: string;
  precoOriginalTexto?: string;
  desconto?: string;
  vendas?: string;
  avaliacao?: string;
  avaliacoes?: string;
  marca?: string;
  lojaNome?: string;
  descricao?: string;
};

export type ProdutoShopee = {
  nome: string;
  imagemUrl?: string;
  precoTexto?: string;
  detalhes: DetalhesProduto;
};

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://shopee.com.br/",
  "x-api-source": "pc",
  "accept-language": "pt-BR,pt;q=0.9",
};

// O link final da Shopee tem o formato .../{shopId}/{itemId}, ou .../i.{shopId}.{itemId}
export function extrairIdsShopee(url: string): { shopId: string; itemId: string } | null {
  const pathMatch = url.match(/\/(\d{5,})\/(\d{5,})(?:[/?#]|$)/);
  if (pathMatch) return { shopId: pathMatch[1], itemId: pathMatch[2] };
  const iMatch = url.match(/-i\.(\d+)\.(\d+)/);
  if (iMatch) return { shopId: iMatch[1], itemId: iMatch[2] };
  return null;
}

// A Shopee guarda preços em "micro unidades" (1 real = 100000)
const reais = (micro: number | undefined) =>
  typeof micro === "number" && micro > 0 ? (micro / 100000).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : undefined;

function urlImagem(hash: string) {
  return `https://down-br.img.susercontent.com/file/${hash}`;
}

function formatarVendas(n: number | undefined) {
  if (!n) return undefined;
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} mil vendidos` : `${n} vendidos`;
}

// Busca a URL da Shopee. Se SCRAPERAPI_KEY estiver configurada, passa pelo
// ScraperAPI (IP que a Shopee aceita). Tenta primeiro no modo normal (1 crédito)
// e, se falhar, no modo premium (10 créditos). Sem a chave, tenta direto.
async function buscarJsonShopee(url: string): Promise<any | null> {
  const chave = process.env.SCRAPERAPI_KEY;
  if (!chave) {
    const res = await fetch(url, { headers: HEADERS });
    return res.ok ? res.json() : null;
  }

  for (const premium of [false, true]) {
    const params = new URLSearchParams({ api_key: chave, url, country_code: "br" });
    if (premium) params.set("premium", "true");
    try {
      const res = await fetch(`https://api.scraperapi.com/?${params.toString()}`);
      if (!res.ok) continue;
      const json = JSON.parse(await res.text());
      if (json?.data) return json;
    } catch {
      // tenta o próximo modo
    }
  }
  return null;
}

export async function buscarProdutoShopee(linkFinal: string): Promise<ProdutoShopee | null> {
  const ids = extrairIdsShopee(linkFinal);
  if (!ids) return null;

  try {
    const json = await buscarJsonShopee(
      `https://shopee.com.br/api/v4/item/get?itemid=${ids.itemId}&shopid=${ids.shopId}`
    );
    const item = json?.data;
    if (!item?.name) return null;

    // Nome da loja (endpoint separado; se falhar, segue sem ele)
    let lojaNome: string | undefined;
    try {
      const jsonLoja = await buscarJsonShopee(
        `https://shopee.com.br/api/v4/shop/get_shop_detail?shopid=${ids.shopId}`
      );
      lojaNome = jsonLoja?.data?.name;
    } catch {}

    const precoAtual = item.price_min ?? item.price;
    const precoAntigo = item.price_before_discount;
    const temDesconto = precoAntigo && precoAtual && precoAntigo > precoAtual;
    const percentual = temDesconto ? Math.round(((precoAntigo - precoAtual) / precoAntigo) * 100) : undefined;

    const notaMedia = item.item_rating?.rating_star;
    const totalAvaliacoes = item.item_rating?.rating_count?.[0];

    const detalhes: DetalhesProduto = {
      imagemUrl: item.images?.[0] ? urlImagem(item.images[0]) : undefined,
      precoTexto: reais(precoAtual),
      precoOriginalTexto: temDesconto ? reais(precoAntigo) : undefined,
      desconto: percentual ? `${percentual}% OFF` : undefined,
      vendas: formatarVendas(item.historical_sold ?? item.sold),
      avaliacao: notaMedia ? `${Number(notaMedia).toFixed(1).replace(".", ",")} ★` : undefined,
      avaliacoes: totalAvaliacoes ? `${totalAvaliacoes} avaliações` : undefined,
      marca: item.brand || undefined,
      lojaNome,
      descricao: item.description ? String(item.description).slice(0, 400) : undefined,
    };

    return {
      nome: item.name,
      imagemUrl: detalhes.imagemUrl,
      precoTexto: detalhes.precoTexto,
      detalhes,
    };
  } catch {
    return null;
  }
}
