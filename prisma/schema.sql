-- Cole este SQL inteiro no SQL Editor do Supabase (Project > SQL Editor > New query > Run)
-- Cria as tabelas que o app vai usar quando você ligar o banco de dados real.

create table if not exists usuario (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  criado_em timestamptz default now()
);

create table if not exists canal (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuario(id) on delete cascade,
  rede text not null,
  suporte text not null,
  access_token text,
  refresh_token text,
  expira_em timestamptz,
  conta_conectada text,
  conta_id text,
  conectado boolean default false
);

create table if not exists loja (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuario(id) on delete cascade,
  nome text not null,
  padrao boolean default false,
  template_link text
);

create table if not exists video (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuario(id) on delete cascade,
  loja_id uuid references loja(id),
  produto_nome text not null,
  link_afiliado text not null,
  legenda text,
  url_arquivo text,
  origem text not null,
  status text default 'rascunho',
  criado_em timestamptz default now()
);

create table if not exists postagem (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references video(id) on delete cascade,
  canal_id uuid references canal(id),
  status text not null,
  data_agendada timestamptz default now(),
  data_postada timestamptz,
  erro text
);
