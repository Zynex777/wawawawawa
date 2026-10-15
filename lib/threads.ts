// Threads API (Meta). Usa o mesmo app da Meta, com o produto "Threads API".
// Texto, foto e vídeo. O link no texto fica clicável.
const BASE = "https://graph.threads.net/v1.0";

export function urlAutorizacaoThreads(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.THREADS_APP_ID ?? "",
    redirect_uri: redirectUri,
    scope: "threads_basic,threads_content_publish",
    response_type: "code",
    state,
  });
  return `https://threads.net/oauth/authorize?${params.toString()}`;
}

async function lerJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    const msg = data?.error?.message || data?.error_message || data?.error_description;
    throw new Error(msg || `Erro ${res.status} na API do Threads`);
  }
  return data;
}

export async function trocarCodePorToken(code: string, redirectUri: string) {
  const data = await lerJson(
    await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.THREADS_APP_ID ?? "",
        client_secret: process.env.THREADS_APP_SECRET ?? "",
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code: code.replace(/#_$/, ""),
      }),
    })
  );
  return { accessToken: data.access_token as string, userId: String(data.user_id) };
}

// Token curto (1h) -> longo (~60 dias)
export async function trocarPorTokenLongo(tokenCurto: string) {
  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: process.env.THREADS_APP_SECRET ?? "",
    access_token: tokenCurto,
  });
  const data = await lerJson(await fetch(`https://graph.threads.net/access_token?${params.toString()}`));
  return { accessToken: data.access_token as string, expiresIn: Number(data.expires_in ?? 60 * 24 * 3600) };
}

export async function renovarToken(tokenLongo: string) {
  const params = new URLSearchParams({ grant_type: "th_refresh_token", access_token: tokenLongo });
  const data = await lerJson(await fetch(`https://graph.threads.net/refresh_access_token?${params.toString()}`));
  return { accessToken: data.access_token as string, expiresIn: Number(data.expires_in ?? 60 * 24 * 3600) };
}

export async function buscarPerfilThreads(accessToken: string) {
  const data = await lerJson(
    await fetch(`${BASE}/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`)
  );
  return { id: String(data.id), username: data.username as string | undefined };
}

type TipoMidia = "TEXT" | "IMAGE" | "VIDEO";
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function criarContainer(userId: string, token: string, campos: Record<string, string>) {
  const data = await lerJson(
    await fetch(`${BASE}/${userId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ...campos, access_token: token }),
    })
  );
  return data.id as string;
}

async function statusContainer(containerId: string, token: string) {
  const data = await lerJson(
    await fetch(`${BASE}/${containerId}?fields=status,error_message&access_token=${encodeURIComponent(token)}`)
  );
  return { status: data.status as string, detalhe: data.error_message as string | undefined };
}

async function publicarContainer(userId: string, token: string, containerId: string) {
  const data = await lerJson(
    await fetch(`${BASE}/${userId}/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ creation_id: containerId, access_token: token }),
    })
  );
  return data.id as string;
}

// Publica texto, foto ou vídeo. Mídia espera o processamento (até ~40s);
// se passar disso, devolve "processando" e termina depois, no Histórico.
export async function publicarPost(opts: {
  userId: string;
  token: string;
  texto: string;
  urlImagem?: string;
  urlVideo?: string;
  limiteMs?: number;
}): Promise<{ resultado: "publicado" | "processando"; containerId: string }> {
  const texto = opts.texto.slice(0, 500);
  const tipo: TipoMidia = opts.urlVideo ? "VIDEO" : opts.urlImagem ? "IMAGE" : "TEXT";

  const campos: Record<string, string> = { media_type: tipo, text: texto };
  if (tipo === "VIDEO") campos.video_url = opts.urlVideo!;
  if (tipo === "IMAGE") campos.image_url = opts.urlImagem!;

  const containerId = await criarContainer(opts.userId, opts.token, campos);

  if (tipo === "TEXT") {
    await publicarContainer(opts.userId, opts.token, containerId);
    return { resultado: "publicado", containerId };
  }

  const limite = opts.limiteMs ?? 40000;
  const inicio = Date.now();
  while (Date.now() - inicio < limite) {
    await esperar(4000);
    const { status, detalhe } = await statusContainer(containerId, opts.token);
    if (status === "FINISHED") {
      await publicarContainer(opts.userId, opts.token, containerId);
      return { resultado: "publicado", containerId };
    }
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`O Threads recusou a mídia (${detalhe ?? status}).`);
    }
  }
  return { resultado: "processando", containerId };
}

// Finaliza um post que ficou processando
export async function finalizarPostPendente(userId: string, token: string, containerId: string) {
  const { status, detalhe } = await statusContainer(containerId, token);
  if (status === "FINISHED") {
    await publicarContainer(userId, token, containerId);
    return "publicado" as const;
  }
  if (status === "ERROR" || status === "EXPIRED") {
    throw new Error(`O Threads recusou a mídia (${detalhe ?? status}).`);
  }
  return "processando" as const;
}
