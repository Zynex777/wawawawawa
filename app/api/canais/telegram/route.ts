import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { verificarChatTelegram } from "@/lib/telegram";
import { respostaErro } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const botToken = String(body.botToken ?? "").trim();
    const chatId = String(body.chatId ?? "").trim();
    if (!botToken || !chatId) {
      return NextResponse.json({ erro: "Token do bot e ID do chat são obrigatórios" }, { status: 400 });
    }

    const nomeChat = await verificarChatTelegram(botToken, chatId);

    const usuario = await getOrCreateUsuario();
    await prisma.canal.updateMany({
      where: { usuarioId: usuario.id, rede: "telegram" },
      data: {
        conectado: true,
        contaConectada: nomeChat,
        contaId: chatId,
        accessToken: botToken,
      },
    });

    return NextResponse.json({ ok: true, nomeChat });
  } catch (e) {
    return respostaErro(e, "POST /api/canais/telegram");
  }
}
