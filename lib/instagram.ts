// Instagram API com login do Instagram (não precisa de Página do Facebook).
// Exige conta profissional (Criador ou Empresa). Vídeos saem como Reels.
const GRAPH = "https://graph.instagram.com/v23.0";

export function urlAutorizacaoInstagram(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.IG_APP_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_content_publish",
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

async function lerJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    const msg = data?.error?.message || data?.error_message || data?.error_description;
    throw new Error(msg || `Erro ${res.status} na API do Instagram`);
  }
  return data;
}

export async function trocarCodePorToken(code: string, redirectUri: string) {
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.IG_APP_ID ?? "",
      client_secret: process.env.IG_APP_SECRET ?? "",
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: code.replace(/#_$/, ""),
    }),
  });
  const data = await lerJson(res);
  // A resposta vem às vezes direto, às vezes dentro de data[0]
  const item = Array.isArray(data.data) ? data.data[0] : data;
  return { accessToken: item.access_token as string };
}

// Troca o token curto (1h) por um longo (~60 dias)
export async function trocarPorTokenLongo(tokenCurto: string) {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: process.env.IG_APP_SECRET ?? "",
    access_token: tokenCurto,
  });
  const data = await lerJson(await fetch(`https://graph.instagram.com/access_token?${params.toString()}`));
  return { accessToken: data.access_token as string, expiresIn: Number(data.expires_in ?? 60 * 24 * 3600) };
}

// Renova o token longo por mais ~60 dias (só funciona com token ainda válido)
export async function renovarToken(tokenLongo: string) {
  const params = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: tokenLongo });
  const data = await lerJson(await fetch(`https://graph.instagram.com/refresh_access_token?${params.toString()}`));
  return { accessToken: data.access_token as string, expiresIn: Number(data.expires_in ?? 60 * 24 * 3600) };
}

export async function buscarContaInstagram(accessToken: string) {
  const data = await lerJson(
    await fetch(`${GRAPH}/me?fields=user_id,username&access_token=${encodeURIComponent(accessToken)}`)
  );
  return { igId: String(data.user_id ?? data.id), username: data.username as string };
}

// Passo 1: cria o "container" do Reel. O Instagram baixa o vídeo da URL pública.
export async function criarContainerReel(igId: string, accessToken: string, urlVideo: string, legenda: string) {
  const data = await lerJson(
    await fetch(`${GRAPH}/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        media_type: "REELS",
        video_url: urlVideo,
        caption: legenda.slice(0, 2200),
        access_token: accessToken,
      }),
    })
  );
  return data.id as string;
}

export type StatusContainer = "FINISHED" | "IN_PROGRESS" | "ERROR" | "EXPIRED" | "PUBLISHED";

export async function statusContainer(containerId: string, accessToken: string) {
  const data = await lerJson(
    await fetch(
      `${GRAPH}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`
    )
  );
  return { status: data.status_code as StatusContainer, detalhe: data.status as string | undefined };
}

// Passo 2: publica o container depois que o Instagram terminou de processar o vídeo
export async function publicarContainer(igId: string, accessToken: string, containerId: string) {
  const data = await lerJson(
    await fetch(`${GRAPH}/${igId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ creation_id: containerId, access_token: accessToken }),
    })
  );
  return data.id as string;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Espera o processamento por até `limiteMs`. Se terminar, publica.
// Retorna "publicado", ou "processando" se o Instagram ainda não terminou
// (aí o app termina a publicação depois, quando o Histórico for aberto).
export async function publicarReel(
  igId: string,
  accessToken: string,
  urlVideo: string,
  legenda: string,
  limiteMs = 40000
): Promise<{ resultado: "publicado" | "processando"; containerId: string }> {
  const containerId = await criarContainerReel(igId, accessToken, urlVideo, legenda);
  const inicio = Date.now();

  while (Date.now() - inicio < limiteMs) {
    await esperar(4000);
    const { status, detalhe } = await statusContainer(containerId, accessToken);
    if (status === "FINISHED") {
      await publicarContainer(igId, accessToken, containerId);
      return { resultado: "publicado", containerId };
    }
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(
        `O Instagram recusou o vídeo (${detalhe ?? status}). Confira se é MP4/H.264, entre 3s e 15min.`
      );
    }
  }
  return { resultado: "processando", containerId };
}

// Foto no feed do Instagram (vira post de imagem, não Reel).
export async function publicarFoto(
  igId: string,
  accessToken: string,
  urlImagem: string,
  legenda: string,
  limiteMs = 40000
): Promise<{ resultado: "publicado" | "processando"; containerId: string }> {
  const data = await lerJson(
    await fetch(`${GRAPH}/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image_url: urlImagem,
        caption: legenda.slice(0, 2200),
        access_token: accessToken,
      }),
    })
  );
  const containerId = data.id as string;
  const inicio = Date.now();

  while (Date.now() - inicio < limiteMs) {
    await esperar(3000);
    const { status, detalhe } = await statusContainer(containerId, accessToken);
    if (status === "FINISHED") {
      await publicarContainer(igId, accessToken, containerId);
      return { resultado: "publicado", containerId };
    }
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`O Instagram recusou a imagem (${detalhe ?? status}).`);
    }
  }
  return { resultado: "processando", containerId };
}
