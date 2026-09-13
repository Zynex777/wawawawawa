export function urlAutorizacaoML(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ML_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    state,
  });
  return `https://auth.mercadolivre.com.br/authorization?${params.toString()}`;
}

type TokenML = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
};

export async function trocarCodePorToken(code: string, redirectUri: string): Promise<TokenML> {
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.ML_CLIENT_ID ?? "",
      client_secret: process.env.ML_CLIENT_SECRET ?? "",
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Falha ao trocar o código pelo token do Mercado Livre");
  return data;
}

export async function buscarUsuarioML(accessToken: string) {
  const res = await fetch("https://api.mercadolibre.com/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Falha ao buscar os dados da conta do Mercado Livre");
  return data as { id: number; nickname: string };
}
