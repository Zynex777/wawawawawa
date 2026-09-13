# Afiliado Multipost

App para cadastrar suas lojas de afiliado, conectar seus canais e postar o vídeo de um produto em todos os
canais de uma vez.

No ar em: https://multipost-afiliado.vercel.app

## Mercado Livre — integração real (primeira rede ligada)

O botão "Conectar" do Mercado Livre na tela de Canais agora abre o login de verdade da sua conta do
Mercado Livre (OAuth). Pra funcionar, faltam esses passos:

1. No painel do seu app em [developers.mercadolivre.com.br](https://developers.mercadolivre.com.br),
   em **"URIs de redirect"**, cadastre exatamente:
   `https://multipost-afiliado.vercel.app/api/auth/mercadolivre/callback`
2. No Vercel, em **Settings > Environment Variables**, adicione:
   - `ML_CLIENT_ID` — o "ID do aplicativo" do seu app do Mercado Livre
   - `ML_CLIENT_SECRET` — a "Chave secreta" do seu app
3. Redeploy (aba **Deployments** > "..." do último deploy > **Redeploy**)

Depois disso, ao clicar em "Conectar" no Mercado Livre dentro do app, você é levado pra tela de login
oficial do Mercado Livre; ao autorizar, o app grava o token de acesso e o nome da sua conta automaticamente.
As outras 7 redes continuam com o botão de conectar simulado até serem integradas na mesma lógica.

## O que mudou nesta versão: banco de dados real

Antes os dados ficavam salvos só no navegador. Agora o app lê e grava direto no Postgres do seu Supabase
(as mesmas tabelas do `prisma/schema.sql` que você já rodou). Pra funcionar, faltam 2 variáveis de
ambiente no Vercel:

1. No painel do Vercel, vá em **Settings > Environment Variables** do projeto e adicione:
   - `DATABASE_URL` — a connection string do Supabase (Project Settings > Database > Connection string,
     modo **URI**, com sua senha no lugar de `[YOUR-PASSWORD]`)
   - `ADMIN_PASSWORD` — uma senha só sua, pra entrar na área `/admin`
2. Depois de salvar, vá na aba **Deployments**, abra os "..." do último deploy e clique em **Redeploy**
   (variáveis de ambiente só valem a partir do próximo deploy)

Sem isso o site abre, mas as telas ficam sem carregar dados.

## Área admin (`/admin`) — teste de credenciais de API

Criada pra quando formos ligando cada rede social de verdade. Funciona assim:

- Acesse `/admin` — pede a senha que você colocou em `ADMIN_PASSWORD`
- Pra cada canal, dá pra colar a conta conectada e o token de acesso de teste e salvar
- Isso só guarda a credencial no banco pra testarmos; não ativa postagem automática sozinho — cada rede
  social vai precisar da integração de fato (explicado abaixo) antes de postar de verdade
- Fica fora do menu do app comum — só quem tem a senha acessa

## Como cada canal vai ficar automático (na ordem que faz sentido)

| Canal | Situação |
|---|---|
| Mercado Livre | **Implementado** — login OAuth real, ver seção acima |
| YouTube | API oficial (YouTube Data API) — próxima da fila |
| Facebook / Instagram | API oficial (Meta Graph API), exige conta comercial |
| X | API oficial, nível pago pra postar vídeo |
| TikTok | Tem API mas com aprovação restrita — fica em fila de revisão do TikTok |
| Kwai / WhatsApp | Sem API pública de postagem — sempre vai ser manual (vídeo e legenda prontos, você só confirma) |

Me avise quando quiser começar a implementar a integração de algum desses — cada uma precisa que você
crie um "app" de desenvolvedor na respectiva plataforma e me passe as chaves (client ID / client secret),
que aí testamos direto na área admin antes de liberar pros usuários.

## Rodando localmente / redeploy

Depois de qualquer alteração no código, é só subir pro GitHub — o Vercel refaz o deploy sozinho.

## Stack

Next.js 14 + React + TypeScript + Tailwind CSS + Prisma + Postgres (Supabase), no Vercel.
