export type SuporteAPI = "automatico" | "manual";

export type Canal = {
  id: string;
  nome: string;
  icone: string; // lucide icon name
  conectado: boolean;
  suporte: SuporteAPI;
  contaConectada?: string;
};

export type Loja = {
  id: string;
  nome: string;
  padrao: boolean;
  templateLink: string;
};

export type Video = {
  id: string;
  produtoNome: string;
  lojaId: string;
  origem: "automatico" | "galeria";
  urlThumb: string;
  legenda: string;
  linkAfiliado: string;
  criadoEm: string;
};

export type StatusPostagem = "publicado" | "pendente" | "falhou" | "manual";

export type Postagem = {
  id: string;
  videoId: string;
  canalId: string;
  status: StatusPostagem;
  dataAgendada: string;
  dataPostada?: string;
  erro?: string;
};
