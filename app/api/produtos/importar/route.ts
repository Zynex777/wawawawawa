import { NextResponse } from "next/server";
import {
  detectarLojaPorUrl,
  resolverLinkFinal,
  buscarProdutoMercadoLivre,
  buscarProdutoPorMetaTags,
} from "@/lib/produto-scraper";
import { respostaErro } from "@/lib/api-utils";
import { buscarProdutoShopee } from "@/lib/shopee";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entrada = String(body.link ?? "").trim();
    if (!entrada) return NextResponse.json({ erro: "Cole um link" }, { status: 400 });

    // Aceita o link sozinho ou o texto de compartilhamento do app da loja
    // (ex.: "Nome do produto ... https://s.shopee.com.br/xyz"). Pega o link e
    // usa o texto que vem junto como nome sugerido.
    const achado = entrada.match(/https?:\/\/[^\s]+/);
    const link = achado ? achado[0].replace(/[.,;)]+$/, "") : entrada;
    const nomeSugerido = achado
      ? entrada.replace(achado[0], "").replace(/\s+/g, " ").trim() || undefined
      : undefined;

    const linkFinal = await resolverLinkFinal(link);
    const loja = detectarLojaPorUrl(linkFinal);

    if (loja === "mercadolivre") {
      const produto = await buscarProdutoMercadoLivre(linkFinal);
      if (produto) {
        return NextResponse.json({ loja, linkLimpo: link, encontrado: true, manual: false, ...produto });
      }
    }

    if (loja === "shopee") {
      const produto = await buscarProdutoShopee(linkFinal);
      if (produto) {
        return NextResponse.json({ loja, linkLimpo: link, encontrado: true, manual: false, ...produto });
      }
    }

    // Demais lojas (e Mercado Livre caso o item não seja encontrado pela API):
    // tenta ler as tags da própria página. Nem toda loja libera isso.
    const produtoGenerico = await buscarProdutoPorMetaTags(linkFinal);
    if (produtoGenerico) {
      return NextResponse.json({ loja, linkLimpo: link, encontrado: true, manual: false, ...produtoGenerico });
    }

    return NextResponse.json({
      loja,
      linkLimpo: link,
      nomeSugerido,
      encontrado: false,
      manual: true,
      aviso: loja
        ? loja === "shopee"
          ? "A Shopee bloqueou a consulta automática. Toque em Compartilhar no produto na Shopee, copie o texto e cole aqui — o nome vem junto."
          : "Não deu pra puxar os dados automaticamente dessa loja. Preencha o nome do produto na mão."
        : "Não reconheci a loja desse link. Cadastre essa loja em Lojas e preencha o nome do produto na mão.",
    });
  } catch (e) {
    return respostaErro(e, "POST /api/produtos/importar");
  }
}
