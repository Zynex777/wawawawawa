import { prisma } from "@/lib/db";

const EMAIL_PADRAO = "rodrigo@afiliado-multipost.local";

// "automatico" = o app publica sozinho (código de publicação implementado).
// "manual" = o app deixa vídeo + texto prontos e você posta na mão.
const CANAIS_PADRAO = [
  { rede: "facebook", suporte: "automatico" },
  { rede: "instagram", suporte: "automatico" },
  { rede: "telegram", suporte: "automatico" },
  { rede: "threads", suporte: "automatico" },
  { rede: "tiktok", suporte: "automatico" },
  { rede: "x", suporte: "manual" }, // API paga — postagem manual por decisão
  { rede: "youtube", suporte: "manual" }, // ainda não implementado
  { rede: "kwai", suporte: "manual" },
  { rede: "whatsapp", suporte: "manual" },
  { rede: "mercadolivre", suporte: "manual" }, // ML não tem feed pra vídeo solto
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
    select: { id: true, rede: true, suporte: true },
  });

  // Corrige o tipo (automático/manual) de canais criados em versões antigas do app
  for (const padrao of CANAIS_PADRAO) {
    const existente = canaisExistentes.find((c: { rede: string }) => c.rede === padrao.rede);
    if (existente && existente.suporte !== padrao.suporte) {
      await prisma.canal.update({ where: { id: existente.id }, data: { suporte: padrao.suporte } });
    }
  }
  const redesExistentes = new Set(canaisExistentes.map((c: { rede: string }) => c.rede));
  const canaisFaltando = CANAIS_PADRAO.filter((c) => !redesExistentes.has(c.rede));
  if (canaisFaltando.length > 0) {
    await prisma.canal.createMany({
      data: canaisFaltando.map((c) => ({ ...c, usuarioId: usuario!.id })),
      skipDuplicates: true,
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
