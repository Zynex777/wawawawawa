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

// Envia o arquivo do vídeo direto (multipart). Por link, o Telegram só aceita
// até 20MB; enviando o arquivo, aceita até 50MB.
export async function publicarVideoTelegram(
  botToken: string,
  chatId: string,
  urlVideoPublica: string,
  legenda: string
) {
  const respVideo = await fetch(urlVideoPublica);
  if (!respVideo.ok) throw new Error("Não consegui baixar o vídeo pra enviar ao Telegram");
  const bytes = await respVideo.arrayBuffer();

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", legenda.slice(0, 1024));
  form.append("supports_streaming", "true");
  form.append("video", new Blob([bytes], { type: "video/mp4" }), "video.mp4");

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Falha ao publicar no Telegram");
  return data.result;
}
