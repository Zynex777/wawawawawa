const VERSAO_API = "v19.0";

export function urlAutorizacaoFacebook(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.FB_APP_ID ?? "",
    redirect_uri: redirectUri,
    state,
    scope: "pages_show_list,pages_manage_posts,pages_read_engagement",
  });
  return `https://www.facebook.com/${VERSAO_API}/dialog/oauth?${params.toString()}`;
}

async function chamarGraph(url: string) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Falha ao falar com a API do Facebook");
  return data;
}

export async function trocarCodePorToken(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.FB_APP_ID ?? "",
    client_secret: process.env.FB_APP_SECRET ?? "",
    redirect_uri: redirectUri,
    code,
  });
  return chamarGraph(`https://graph.facebook.com/${VERSAO_API}/oauth/access_token?${params.toString()}`) as Promise<{
    access_token: string;
    expires_in?: number;
  }>;
}

// Troca o token de curta duração (~1h ou ~2h) por um de longa duração (~60 dias).
export async function trocarPorTokenLongo(tokenCurto: string) {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.FB_APP_ID ?? "",
    client_secret: process.env.FB_APP_SECRET ?? "",
    fb_exchange_token: tokenCurto,
  });
  return chamarGraph(`https://graph.facebook.com/${VERSAO_API}/oauth/access_token?${params.toString()}`) as Promise<{
    access_token: string;
    expires_in?: number;
  }>;
}

// Postar como app funciona em cima de uma Página, não do perfil pessoal.
// Pega a primeira Página que o usuário administra.
export async function buscarPrimeiraPagina(tokenUsuarioLongo: string) {
  const data = await chamarGraph(
    `https://graph.facebook.com/${VERSAO_API}/me/accounts?access_token=${tokenUsuarioLongo}`
  );
  const pagina = data.data?.[0];
  if (!pagina) throw new Error("Nenhuma Página do Facebook encontrada nessa conta.");
  return pagina as { id: string; name: string; access_token: string };
}

// Publica um vídeo (por URL pública) no feed de uma Página do Facebook.
export async function publicarVideoNaPagina(
  idPagina: string,
  tokenPagina: string,
  urlVideo: string,
  legenda?: string
) {
  const params = new URLSearchParams({
    access_token: tokenPagina,
    file_url: urlVideo,
    description: legenda ?? "",
  });
  const res = await fetch(`https://graph-video.facebook.com/${VERSAO_API}/${idPagina}/videos`, {
    method: "POST",
    body: params,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Falha ao publicar o vídeo no Facebook");
  return data as { id: string };
}
