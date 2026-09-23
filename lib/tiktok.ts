export function urlAutorizacaoTikTok(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
    scope: "user.info.basic,video.publish",
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export async function trocarCodePorToken(code: string, redirectUri: string) {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || "Falha ao trocar o código do TikTok");
  }
  return data as { access_token: string; refresh_token: string; open_id: string; expires_in: number };
}

export async function buscarPerfilTikTok(accessToken: string): Promise<string | undefined> {
  try {
    const res = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return data?.data?.user?.display_name;
  } catch {
    return undefined;
  }
}

// Publica enviando o arquivo direto (em vez de PULL_FROM_URL), porque essa
// segunda opção exige verificar a posse do domínio do link do vídeo — o que
// não dá pra fazer com um link do Supabase, já que o domínio não é nosso.
//
// Apps do TikTok sem auditoria só podem postar como "somente eu" (SELF_ONLY);
// pra postar público de verdade, o app precisa passar pela revisão da TikTok.
export async function publicarVideoTikTok(
  accessToken: string,
  urlVideoPublica: string,
  legenda: string
): Promise<{ publishId: string }> {
  const respVideo = await fetch(urlVideoPublica);
  if (!respVideo.ok) throw new Error("Não consegui baixar o vídeo pra enviar ao TikTok");
  const buffer = Buffer.from(await respVideo.arrayBuffer());

  const resInit = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: legenda.slice(0, 150),
        privacy_level: "SELF_ONLY",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: buffer.length,
        chunk_size: buffer.length,
        total_chunk_count: 1,
      },
    }),
  });
  const dataInit = await resInit.json();
  if (!resInit.ok || dataInit.error?.code !== "ok") {
    throw new Error(dataInit.error?.message || "Falha ao iniciar a publicação no TikTok");
  }

  const uploadUrl = dataInit.data.upload_url as string;
  const resUpload = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Range": `bytes 0-${buffer.length - 1}/${buffer.length}`,
    },
    body: buffer,
  });
  if (!resUpload.ok) throw new Error("Falha ao enviar o arquivo de vídeo pro TikTok");

  return { publishId: dataInit.data.publish_id };
}
