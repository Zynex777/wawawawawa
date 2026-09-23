# Afiliado Multipost

App para cadastrar suas lojas de afiliado, conectar seus canais e postar o vídeo de um produto em todos os
canais de uma vez.

No ar em: https://multipost-afiliado.vercel.app

## Checklist de configuração (Vercel)

Cole essas variáveis em **Settings > Environment Variables** e faça **redeploy** depois (Deployments > "..."
do último > Redeploy — sem isso nada de novo entra em vigor):

| Variável | Onde pegar |
|---|---|
| `DATABASE_URL` | Supabase > Project Settings > Database > Connection pooling > modo "Transaction" > copia a URI, troca a senha, adiciona `?pgbouncer=true` no final |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API > "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API > "anon public" |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API > "service_role" (secreta) |
| `ADMIN_PASSWORD` | Inventada por você, pra entrar em `/admin` |
| `ML_CLIENT_ID` / `ML_CLIENT_SECRET` | developers.mercadolivre.com.br > seu app > "ID do aplicativo" / "Chave secreta" |
| `FB_APP_ID` / `FB_APP_SECRET` | developers.facebook.com > seu app > Configurações > Básico |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | developers.tiktok.com > seu app |

Telegram não precisa de variável de ambiente — o token do bot é colado direto na tela Canais do app.

## SQL necessário no Supabase (uma vez só)

No SQL Editor do Supabase, se ainda não rodou:

```sql
alter table canal add column if not exists conta_id text;
```

Guarda o ID da Página/canal/chat de cada rede (Página do Facebook, chat do Telegram etc.) — sem essa
coluna a publicação automática não sabe pra onde postar.

## Status de cada canal

| Canal | Situação |
|---|---|
| Mercado Livre | **Automático** — login OAuth real |
| Facebook | **Automático** — login OAuth real, publica no feed da Página |
| Telegram | **Automático** — sem OAuth, só token de bot + ID do chat |
| TikTok | **Automático, mas só privado** — apps sem auditoria da TikTok só postam como "somente eu" (`SELF_ONLY`); pra postar público de verdade, precisa passar pela revisão da TikTok |
| YouTube | Ainda manual — próximo da fila |
| Instagram | Ainda manual — precisa de conta comercial vinculada a uma Página do Facebook |
| X | Ainda manual — precisa de nível pago da API pra postar vídeo |
| Kwai / WhatsApp | Sempre vão ser manuais — essas redes não têm API pública de postagem |

Pras manuais, o Histórico já deixa o texto do post (legenda + link) pronto pra copiar e colar.

## Link dentro do post (não mais "link na bio")

O link de afiliado agora vai escrito dentro da própria legenda/descrição do post, em toda rede automática
(Facebook, TikTok, Telegram) e também no texto pronto pra copiar das manuais. Um detalhe: o TikTok não
transforma texto de descrição em link clicável pra contas comuns — o link aparece como texto, não como
botão.

## Passo a passo por rede

### Mercado Livre
1. Em developers.mercadolivre.com.br, no seu app, cadastre em "URIs de redirect":
   `https://multipost-afiliado.vercel.app/api/auth/mercadolivre/callback`
2. Adicione `ML_CLIENT_ID` e `ML_CLIENT_SECRET` no Vercel, redeploy
3. Clica em "Conectar" no Mercado Livre, na tela Canais

### Facebook
1. Em developers.facebook.com, no seu app, em Login do Facebook > Configurações, cadastre em "URIs de
   redirecionamento do OAuth válidos": `https://multipost-afiliado.vercel.app/api/auth/facebook/callback`
2. Ative as permissões `pages_show_list`, `pages_manage_posts` e `pages_read_engagement` (ficam em
   "Permissões e Recursos" — em apps criados com o produto **Login do Facebook para Empresas**, não o
   Login comum)
3. Adicione `FB_APP_ID` e `FB_APP_SECRET` no Vercel, redeploy
4. Clica em "Conectar" no Facebook — o app pega a primeira Página que você administra

### TikTok
1. Em developers.tiktok.com, crie um app com os produtos **Login Kit** e **Content Posting API**
2. Cadastre o redirect URI: `https://multipost-afiliado.vercel.app/api/auth/tiktok/callback`
3. Adicione os escopos `user.info.basic` e `video.publish`
4. Adicione `TIKTOK_CLIENT_KEY` e `TIKTOK_CLIENT_SECRET` no Vercel, redeploy
5. Clica em "Conectar" no TikTok
6. Lembrete: enquanto seu app não passar pela revisão da TikTok, os vídeos postados só ficam visíveis pra
   você mesmo (modo "somente eu") — é uma trava da própria TikTok, não do app

### Telegram
1. Abre uma conversa com **@BotFather** no Telegram, manda `/newbot` e segue as instruções — no final ele
   te dá um **token**
2. Cria (ou usa um já existente) canal ou grupo do Telegram, e adiciona esse bot como **administrador**
   dele
3. Pra pegar o **ID do chat**: se for um canal público, pode usar o `@nomedocanal` direto; se for privado,
   encaminha uma mensagem do canal pro bot **@userinfobot** que ele te devolve o ID (algo como
   `-1001234567890`)
4. Na tela Canais do app, abre o Telegram, cola o token e o ID do chat, clica em Conectar

## Área admin (`/admin`)

Painel de teste, separado do uso normal — pede a senha de `ADMIN_PASSWORD`. Serve pra colar credenciais de
teste de canais que ainda não têm login real, sem risco de misturar com conexões de verdade: Facebook,
Mercado Livre, TikTok e Telegram ficam travados lá (só conectam pelo fluxo real, na tela Canais).

## Vídeo: compactação e limite de tamanho

Vídeos da galeria maiores que 20MB são compactados automaticamente no navegador antes de subir (reduz pra
720p). O Supabase Storage, no plano gratuito, tem limite de 50MB por arquivo — vídeos maiores que ~500MB
não são nem processados (aviso pra cortar o vídeo antes).

## Limitações atuais

- A publicação automática só funciona pra vídeos **enviados da galeria** (arquivo real hospedado no
  Supabase). Produtos do Mercado Livre com vídeo automático (que é um vídeo do YouTube vinculado ao
  anúncio) ainda caem como manual, mesmo com o canal conectado.
- TikTok só posta em modo privado até a revisão da TikTok ser aprovada (ver acima).

## Stack

Next.js 14 + React + TypeScript + Tailwind CSS + Prisma + Postgres (Supabase) + Supabase Storage +
ffmpeg.wasm, no Vercel.
