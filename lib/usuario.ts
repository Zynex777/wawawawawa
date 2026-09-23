import { prisma } from "@/lib/db";

const EMAIL_PADRAO = "rodrigo@afiliado-multipost.local";

const CANAIS_PADRAO = [
  { rede: "tiktok", suporte: "automatico" },
  { rede: "kwai", suporte: "manual" },
  { rede: "facebook", suporte: "automatico" },
  { rede: "instagram", suporte: "automatico" },
  { rede: "x", suporte: "automatico" },
  { rede: "youtube", suporte: "automatico" },
  { rede: "whatsapp", suporte: "manual" },
  { rede: "mercadolivre", suporte: "automatico" },
  { rede: "telegram", suporte: "automatico" },
];

const LOJAS_PADRAO = [
  { nome: "Mercado Livre", padrao: true },
  { nome: "Shopee", padrao: true },
  { nome: "Amazon", padrao: true },
  { nome: "Shein", padrao: true },
];

// App de usuário único (uso pessoal). Garante que exista um usuário e que
// os canais/lojas padrão estejam cadastrados — inclusive quando um canal ou
// loja novo é adicionado depois que o usuário já existia (roda sempre,
// não só na primeira criação, pra não deixar quem já usa o app pra trás).
export async function getOrCreateUsuario() {
  let usuario = await prisma.usuario.findUnique({ where: { email: EMAIL_PADRAO } });

  if (!usuario) {
    usuario = await prisma.usuario.create({ data: { email: EMAIL_PADRAO } });
  }

  const canaisExistentes = await prisma.canal.findMany({
    where: { usuarioId: usuario.id },
    select: { rede: true },
  });
  const redesExistentes = new Set(canaisExistentes.map((c: { rede: string }) => c.rede));
  const canaisFaltando = CANAIS_PADRAO.filter((c) => !redesExistentes.has(c.rede));
  if (canaisFaltando.length > 0) {
    await prisma.canal.createMany({
      data: canaisFaltando.map((c) => ({ ...c, usuarioId: usuario!.id })),
    });
  }

  const lojasExistentes = await prisma.loja.findMany({
    where: { usuarioId: usuario.id },
    select: { nome: true },
  });
  const nomesExistentes = new Set(lojasExistentes.map((l: { nome: string }) => l.nome));
  const lojasFaltando = LOJAS_PADRAO.filter((l) => !nomesExistentes.has(l.nome));
  if (lojasFaltando.length > 0) {
    await prisma.loja.createMany({
      data: lojasFaltando.map((l) => ({ ...l, usuarioId: usuario!.id })),
    });
  }

  return usuario;
}
