import { Canal, Loja, Video, Postagem } from "./types";

export const canaisIniciais: Canal[] = [
  { id: "tiktok", nome: "TikTok", icone: "Music2", conectado: false, suporte: "manual" },
  { id: "kwai", nome: "Kwai", icone: "Play", conectado: false, suporte: "manual" },
  { id: "facebook", nome: "Facebook", icone: "Facebook", conectado: false, suporte: "automatico" },
  { id: "instagram", nome: "Instagram", icone: "Instagram", conectado: false, suporte: "automatico" },
  { id: "x", nome: "X", icone: "Twitter", conectado: false, suporte: "automatico" },
  { id: "youtube", nome: "YouTube", icone: "Youtube", conectado: false, suporte: "automatico" },
  { id: "whatsapp", nome: "WhatsApp", icone: "MessageCircle", conectado: false, suporte: "manual" },
  { id: "mercadolivre", nome: "Mercado Livre (vídeo)", icone: "ShoppingCart", conectado: false, suporte: "automatico" },
];

export const lojasIniciais: Loja[] = [
  { id: "ml", nome: "Mercado Livre", padrao: true, templateLink: "" },
  { id: "shopee", nome: "Shopee", padrao: true, templateLink: "" },
  { id: "amazon", nome: "Amazon", padrao: true, templateLink: "" },
  { id: "shein", nome: "Shein", padrao: true, templateLink: "" },
];

export const videosIniciais: Video[] = [];

export const postagensIniciais: Postagem[] = [];
