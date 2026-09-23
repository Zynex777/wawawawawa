// Telegram não usa OAuth — o "login" é colar o token do bot (criado no
// @BotFather) e o ID do chat/canal onde ele vai postar.

export async function verificarChatTelegram(botToken: string, chatId: string): Promise<string> {
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(chatId)}`
  );
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || "Não consegui confirmar esse chat no Telegram");
  }
  return data.result.title || data.result.username || chatId;
}

export async function publicarVideoTelegram(
  botToken: string,
  chatId: string,
  urlVideoPublica: string,
  legenda: string
) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ chat_id: chatId, video: urlVideoPublica, caption: legenda }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Falha ao publicar no Telegram");
  return data.result;
}
