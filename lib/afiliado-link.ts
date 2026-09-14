// Aplica o "molde" de afiliado de uma loja em cima do link do produto.
//
// Duas formas de molde são aceitas (o que cobre a maioria dos programas de afiliado):
//
// 1) Contém {PRODUTO} — usado por redes que fazem redirecionamento (Shopee, Shein, Awin, CJ...).
//    O link do produto entra no lugar de {PRODUTO}, com URL-encode.
//    Ex.: https://shein.pxf.io/c/123456/789/012?u={PRODUTO}
//
// 2) Começa com "?" ou "&" — usado por redes que só adicionam parâmetros no próprio link do
//    produto (Mercado Livre, Amazon). Esses parâmetros são anexados na URL original.
//    Ex.: ?matt_word=meucodigo&matt_tool=meucodigo   |   ?tag=meunome-20
//
// Sem nenhum desses padrões, ou sem molde cadastrado, o link do produto é usado como está.
export function aplicarTemplateAfiliado(linkProduto: string, template?: string | null): string {
  const molde = template?.trim();
  if (!molde) return linkProduto;

  if (molde.includes("{PRODUTO}")) {
    return molde.replace(/\{PRODUTO\}/g, encodeURIComponent(linkProduto));
  }

  if (molde.startsWith("?") || molde.startsWith("&")) {
    try {
      const url = new URL(linkProduto);
      const params = new URLSearchParams(molde.replace(/^[?&]/, ""));
      params.forEach((valor, chave) => url.searchParams.set(chave, valor));
      return url.toString();
    } catch {
      return linkProduto;
    }
  }

  // Molde não reconhecido (ex.: um link de exemplo colado sem placeholder) — não dá pra
  // aplicar com segurança em cima de outro produto, então mantém o link original.
  return linkProduto;
}
