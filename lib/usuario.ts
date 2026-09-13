import { prisma } from "@/lib/db";

const EMAIL_PADRAO = "rodrigo@afiliado-multipost.local";

const CANAIS_PADRAO = [
  { rede: "tiktok", suporte: "manual" },
  { rede: "kwai", suporte: "manual" },
  { rede: "facebook", suporte: "automatico" },
  { rede: "instagram", suporte: "automatico" },
  { rede: "x", suporte: "automatico" },
  { rede: "youtube", suporte: "automatico" },
  { rede: "whatsapp", suporte: "manual" },
  { rede: "mercadolivre", suporte: "automatico" },
];

const LOJAS_PADRAO = [
  { nome: "Mercado Livre", padrao: true },
  { nome: "Shopee", padrao: true },
  { nome: "Amazon", padrao: true },
  { nome: "Shein", padrao: true },
];

// App de usuário único (uso pessoal). Garante que exista um usuário e que
// os canais/lojas padrão já estejam cadastrados na primeira vez que alguém acessa.
export async function getOrCreateUsuario() {
  let usuario = await prisma.usuario.findUnique({ where: { email: EMAIL_PADRAO } });

  if (!usuario) {
    usuario = await prisma.usuario.create({ data: { email: EMAIL_PADRAO } });
    await prisma.canal.createMany({
      data: CANAIS_PADRAO.map((c) => ({ ...c, usuarioId: usuario!.id })),
    });
    await prisma.loja.createMany({
      data: LOJAS_PADRAO.map((l) => ({ ...l, usuarioId: usuario!.id })),
    });
  }

  return usuario;
}
