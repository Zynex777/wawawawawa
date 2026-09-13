const COOKIE_NAME = "admin_session";

async function hash(texto: string) {
  const dados = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function gerarTokenSessao() {
  const senha = process.env.ADMIN_PASSWORD ?? "";
  return hash(`sessao:${senha}`);
}

export async function senhaCorreta(tentativa: string) {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) return false;
  return tentativa === senha;
}

export async function tokenValido(token: string | undefined) {
  if (!token) return false;
  const esperado = await gerarTokenSessao();
  return token === esperado;
}

export { COOKIE_NAME };
