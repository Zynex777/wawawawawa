export type SuporteAPI = "automatico" | "manual";

export type Canal = {
  id: string;
  rede: string;
  suporte: SuporteAPI;
  conectado: boolean;
  contaConectada?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
};

export type Loja = {
  id: string;
  nome: string;
  padrao: boolean;
  templateLink?: string | null;
};

export type Video = {
  id: string;
  produtoNome: string;
  lojaId: string;
  origem: "automatico" | "galeria";
  urlArquivo?: string | null;
  legenda?: string | null;
  linkAfiliado: string;
  status: string;
  criadoEm: string;
};

export type StatusPostagem = "publicado" | "pendente" | "falhou" | "manual";

export type Postagem = {
  id: string;
  videoId: string;
  canalId: string;
  status: StatusPostagem;
  dataAgendada: string;
  dataPostada?: string | null;
  erro?: string | null;
};
