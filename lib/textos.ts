// Gera o texto do post a partir dos dados reais do produto.
// Nunca inventa preço, desconto ou benefício: linha sem dado simplesmente some.

const DISCLOSURE =
  "Este é um link de afiliado. Posso receber uma comissão pelas compras realizadas por meio dele, sem custo adicional para você.";

type Info = { nome: string; preco?: string; descricao?: string; marca?: string };

export function infoDoVideo(video: { produtoNome: string; detalhes?: string | null }): Info {
  let d: any = {};
  try {
    d = video.detalhes ? JSON.parse(video.detalhes) : {};
  } catch {
    d = {};
  }
  const descricao = d.descricao ? String(d.descricao).split(/(?<=[.!?])\s/)[0].slice(0, 160) : undefined;
  return {
    nome: video.produtoNome,
    preco: d.precoTexto || undefined,
    descricao,
    marca: d.marca || undefined,
  };
}

// Cada modelo recebe os dados e devolve as linhas (undefined = linha omitida)
const MODELOS: Array<(i: Info, link: string) => Array<string | undefined>> = [
  // 1 — Ofertas imperdíveis
  (i, l) => [
    "🔥 🚨 OFERTAS IMPERDÍVEIS! 🚨 🔥",
    "",
    "😍 Está procurando produtos incríveis com preços especiais? Confira esta opção!",
    "",
    `🛍️ ${i.nome}`,
    i.preco ? `💰 Preço informado: ${i.preco}` : undefined,
    i.descricao ? `✨ ${i.descricao}` : undefined,
    "",
    "👇 Confira os detalhes e o preço atualizado:",
    "",
    l,
    "",
    DISCLOSURE,
  ],
  // 2 — Achadinhos
  (i, l) => [
    "🛍️🔥 ACHADINHOS QUE VOCÊ PRECISA CONHECER! 🔥🛍️",
    "",
    "😍 Olha só esta opção para sua lista de compras!",
    "",
    `✨ ${i.nome}`,
    i.preco ? `🏷️ Preço informado: ${i.preco}` : undefined,
    i.descricao ? `🛒 ${i.descricao}` : undefined,
    "",
    "👇 Clique no link e confira!",
    "",
    l,
    "",
    DISCLOSURE,
  ],
  // 3 — Você já conhece?
  (i, l) => [
    "🚨😍 VOCÊ JÁ CONHECE ESSE PRODUTO? 😍🚨",
    "",
    `🛍️ ${i.nome}`,
    i.marca ? `✨ Marca: ${i.marca}` : i.descricao ? `✨ ${i.descricao}` : undefined,
    i.preco ? `💰 Preço informado: ${i.preco}` : undefined,
    "",
    "Confira os detalhes e veja se este produto combina com o que você procura!",
    "",
    "👇 ACESSE E CONFIRA!",
    "",
    l,
    "",
    DISCLOSURE,
  ],
  // 4 — Sua próxima compra
  (i, l) => [
    "💥🛍️ SUA PRÓXIMA COMPRA PODE ESTAR AQUI! 🛍️💥",
    "",
    "😍 Conheça mais esta opção!",
    "",
    `📦 ${i.nome}`,
    i.preco ? `🏷️ Preço informado: ${i.preco}` : undefined,
    i.descricao ? `✨ ${i.descricao}` : undefined,
    "",
    "👇 Clique e veja mais!",
    "",
    l,
    "",
    DISCLOSURE,
  ],
  // 5 — Novidades
  (i, l) => [
    "🤩🔥 OLHA ESSA NOVIDADE! 🔥🤩",
    "",
    "🛍️ Confira este produto!",
    "",
    i.nome,
    i.preco ? `💰 Preço informado: ${i.preco}` : undefined,
    i.descricao ? `😍 ${i.descricao}` : undefined,
    "",
    "👇 Confira agora!",
    "",
    l,
    "",
    DISCLOSURE,
  ],
  // 6 — Compras conscientes
  (i, l) => [
    "💰🔥 ECONOMIZAR É SEMPRE BOM! 🔥💰",
    "",
    "🛒 Está procurando um produto para sua próxima compra?",
    "",
    i.nome,
    i.preco ? `🏷️ Preço informado: ${i.preco}` : undefined,
    "",
    "✨ Conheça as características, confira os detalhes e compare antes de comprar.",
    "",
    "👇 Clique no link para conferir!",
    "",
    l,
    "",
    DISCLOSURE,
  ],
  // 7 — Mais um achadinho
  (i, l) => [
    "🚀🛍️ MAIS UM ACHADINHO PARA SUA LISTA! 🛍️🚀",
    "",
    "😍 Confira esta opção!",
    "",
    `📦 ${i.nome}`,
    i.preco ? `💰 Preço informado: ${i.preco}` : undefined,
    i.descricao ? `✨ ${i.descricao}` : undefined,
    "",
    "💥 Veja se é o que você procura!",
    "",
    "👇 Acesse o link e confira!",
    "",
    l,
    "",
    DISCLOSURE,
  ],
];

export const TOTAL_MODELOS = MODELOS.length;

// Escolhe um modelo diferente do anterior, pra não repetir em sequência
export function escolherModelo(anterior?: number | null): number {
  const opcoes = [...Array(TOTAL_MODELOS).keys()].filter((m) => m !== anterior);
  return opcoes[Math.floor(Math.random() * opcoes.length)];
}

// Monta o texto. Se passar do limite da rede, tira a descrição e o preço antes de cortar.
export function gerarTexto(
  video: { produtoNome: string; detalhes?: string | null; linkAfiliado: string },
  modelo: number,
  maxChars: number
): string | null {
  const info = infoDoVideo(video);
  const montar = (i: Info) =>
    MODELOS[modelo](i, video.linkAfiliado)
      .filter((x): x is string => x !== undefined)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");

  let texto = montar(info);
  if (texto.length <= maxChars) return texto;

  texto = montar({ ...info, descricao: undefined });
  if (texto.length <= maxChars) return texto;

  texto = montar({ ...info, descricao: undefined, preco: undefined, marca: undefined });
  return texto.length <= maxChars ? texto : null;
}
