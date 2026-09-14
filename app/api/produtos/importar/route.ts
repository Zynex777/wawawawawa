import { NextResponse } from "next/server";
import {
  detectarLojaPorUrl,
  resolverLinkFinal,
  buscarProdutoMercadoLivre,
  buscarProdutoPorMetaTags,
} from "@/lib/produto-scraper";
import { respostaErro } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const link = String(body.link ?? "").trim();
    if (!link) return NextResponse.json({ erro: "Cole um link" }, { status: 400 });

    const linkFinal = await resolverLinkFinal(link);
    const loja = detectarLojaPorUrl(linkFinal);

    if (loja === "mercadolivre") {
      const produto = await buscarProdutoMercadoLivre(linkFinal);
      if (produto) {
        return NextResponse.json({ loja, encontrado: true, manual: false, ...produto });
      }
    }

    // Demais lojas (e Mercado Livre caso o item não seja encontrado pela API):
    // tenta ler as tags da própria página. Nem toda loja libera isso.
    const produtoGenerico = await buscarProdutoPorMetaTags(linkFinal);
    if (produtoGenerico) {
      return NextResponse.json({ loja, encontrado: true, manual: false, ...produtoGenerico });
    }

    return NextResponse.json({
      loja,
      encontrado: false,
      manual: true,
      aviso: loja
        ? "Não deu pra puxar os dados automaticamente dessa loja. Preencha o nome do produto na mão."
        : "Não reconheci a loja desse link. Cadastre essa loja em Lojas e preencha o nome do produto na mão.",
    });
  } catch (e) {
    return respostaErro(e, "POST /api/produtos/importar");
  }
}
