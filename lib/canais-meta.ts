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

// Redes com login real implementado (o admin não pode sobrescrever o token delas)
export const REDES_COM_LOGIN_REAL: Record<string, string> = {
  facebook: "/api/auth/facebook",
  instagram: "/api/auth/instagram",
  tiktok: "/api/auth/tiktok",
  mercadolivre: "/api/auth/mercadolivre",
};

// Telegram não usa OAuth, mas também tem conexão real (token do bot)
export const REDES_TRAVADAS_NO_ADMIN = [...Object.keys(REDES_COM_LOGIN_REAL), "telegram"];
