// Monta o texto final que vai no post — legenda + link do produto juntos,
// em vez de deixar o link só na bio/perfil.
export function montarLegendaComLink(legenda: string | null | undefined, link: string): string {
  const base = (legenda ?? "").trim();
  return base ? `${base}\n\n${link}` : link;
}
