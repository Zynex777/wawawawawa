export const CANAIS_META: Record<string, { nome: string; icone: string }> = {
  tiktok: { nome: "TikTok", icone: "Music2" },
  kwai: { nome: "Kwai", icone: "Play" },
  facebook: { nome: "Facebook", icone: "Facebook" },
  instagram: { nome: "Instagram", icone: "Instagram" },
  x: { nome: "X", icone: "Twitter" },
  youtube: { nome: "YouTube", icone: "Youtube" },
  whatsapp: { nome: "WhatsApp", icone: "MessageCircle" },
  mercadolivre: { nome: "Mercado Livre (vídeo)", icone: "ShoppingCart" },
  telegram: { nome: "Telegram", icone: "Send" },
};

export function nomeCanal(rede: string) {
  return CANAIS_META[rede]?.nome ?? rede;
}

export function iconeCanal(rede: string) {
  return CANAIS_META[rede]?.icone ?? "Radio";
}
