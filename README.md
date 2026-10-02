# Afiliado Multipost

Cole o link do produto, anexe o vídeo, e poste em vários canais de uma vez.
No ar em: https://multipost-afiliado.vercel.app

## Canais

| Canal | Como posta |
|---|---|
| Facebook | Automático — vídeo no feed da sua Página |
| Instagram | Automático — vídeo sai como Reel (conta profissional) |
| Telegram | Automático — bot posta no seu canal/grupo |
| TikTok | Automático, mas privado até a TikTok aprovar o app (pausado) |
| X, YouTube, Kwai, WhatsApp, Mercado Livre | Manual — o Histórico deixa texto + link prontos pra copiar |

Postagem automática só acontece com vídeo **enviado da galeria** na tela Importar.
O link de afiliado vai dentro da legenda. No Facebook e no Telegram ele fica clicável;
no Instagram aparece como texto (o Instagram não deixa link clicável em legenda).

## 1. SQL no Supabase (uma vez)

```sql
alter table canal add column if not exists conta_id text;
alter table postagem add column if not exists externo_id text;
```

## 2. Variáveis no Vercel (Settings > Environment Variables, depois Redeploy)

| Variável | Onde pegar |
|---|---|
| `DATABASE_URL` | Supabase > Project Settings > Database > Connection pooling (Transaction) + `?pgbouncer=true` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API > service_role |
| `ADMIN_PASSWORD` | Senha que você inventa pra `/admin` |
| `FB_APP_ID` / `FB_APP_SECRET` | developers.facebook.com > app > Configurações > Básico |
| `IG_APP_ID` / `IG_APP_SECRET` | developers.facebook.com > app > Instagram > API com login do Instagram |
| `ML_CLIENT_ID` / `ML_CLIENT_SECRET` | developers.mercadolivre.com.br (opcional — só importação de produtos) |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | developers.tiktok.com (opcional — pausado) |

Telegram não usa variável: o token do bot vai direto na tela Canais.

## 3. Redirects para cadastrar nos painéis

- Facebook: `https://multipost-afiliado.vercel.app/api/auth/facebook/callback`
- Instagram: `https://multipost-afiliado.vercel.app/api/auth/instagram/callback`
- Política de privacidade: `https://multipost-afiliado.vercel.app/privacidade`
- Termos: `https://multipost-afiliado.vercel.app/termos`

## Limites

- Vídeo até 50MB (vídeos acima de 20MB são compactados no celular antes de subir)
- Instagram: Reel de 3s a 15min, MP4/H.264; até 50 posts por API a cada 24h.
  O processamento pode demorar — se passar de ~40s, o post aparece como
  "Processando no Instagram…" e termina sozinho ao reabrir o Histórico.
- Telegram: legenda até 1024 caracteres
- Token do Instagram dura ~60 dias e é renovado sozinho quando o app posta

## Stack

Next.js 14 + TypeScript + Tailwind + Prisma + Supabase (Postgres + Storage) + ffmpeg.wasm, no Vercel.
