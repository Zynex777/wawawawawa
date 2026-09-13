# Afiliado Multipost

App para cadastrar suas lojas de afiliado, conectar seus canais e postar o vídeo de um produto em todos os
canais de uma vez.

## O que já está pronto (funciona agora, sem configurar nada)

Um protótipo funcional completo, com todos os fluxos que você pediu, guardando os dados no próprio
navegador (por enquanto sem banco de dados real):

- **Canais**: tela para "conectar" TikTok, Kwai, Facebook, Instagram, X, YouTube, WhatsApp e Mercado Livre
- **Lojas**: Mercado Livre, Shopee, Amazon e Shein já cadastradas, com botão para adicionar novas lojas
- **Importar produto**: cola o link, o app simula a busca automática de nome/loja e pede vídeo da galeria
  quando a loja não tem vídeo automático
- **Vídeos**: banco de vídeos prontos, organizados por loja
- **Postar**: escolhe o vídeo, marca os canais (ou "Selecionar todos") e posta em todos de uma vez
- **Histórico**: mostra o que foi publicado automaticamente e o que ficou pendente de confirmação manual
- Layout responsivo: menu lateral no computador, menu de abas embaixo no celular

## O que ainda é simulado (e por quê)

Isso é a fundação da tela e do fluxo. Duas partes ainda não são reais, porque dependem de coisas que só
você pode fazer (cadastro de app nas plataformas):

1. **Busca automática do produto pelo link** — hoje é simulada. Pra funcionar de verdade em cada loja
   (Mercado Livre, Shopee, Amazon, Shein), preciso implementar a leitura de cada uma, do jeito que já
   fizemos no DigoFertas para o Mercado Livre.
2. **Login e postagem automática nos canais** — hoje o botão "Conectar" só marca como conectado. Pra
   postar de verdade, cada rede social exige que você crie um "app" de desenvolvedor nela e me passe as
   chaves (client ID / client secret). É diferente por rede:
   - **Automatizável de fato**: YouTube, Facebook, Instagram, X, Mercado Livre (têm API oficial de postagem)
   - **Manual (sem API pública de postagem)**: TikTok (API existe mas com aprovação restrita), Kwai,
     WhatsApp — nesses o app vai deixar o vídeo e a legenda prontos, com um botão que abre o app pra você
     só confirmar

Me diga quando quiser seguir pra essa parte, que eu já sei em qual ordem fazer.

## Como colocar no ar (tudo pelo celular, sem terminal)

**1. Subir o código pro GitHub**
- Baixe esse projeto (o zip que te mandei)
- No app do GitHub (ou pelo site, no navegador do celular): crie um repositório novo e faça upload dos
  arquivos, ou peça pra eu te ajudar a subir via GitHub Desktop se você tiver um computador por perto

**2. Criar o banco no Supabase** (só quando formos ligar o banco de dados real)
- Crie um projeto em supabase.com
- Vá em **SQL Editor > New query**, cole o conteúdo do arquivo `prisma/schema.sql` e clique em **Run**
- Isso cria as tabelas de usuário, canal, loja, vídeo e postagem

**3. Publicar no Vercel**
- Entre em vercel.com, clique em **Add New > Project**
- Escolha o repositório que você subiu no GitHub
- Clique em **Deploy** — o Vercel detecta que é Next.js e configura sozinho
- Pronto: você recebe um link tipo `afiliado-multipost.vercel.app` que já abre certo no computador e no
  celular

## Stack usada

Next.js 14 + React + TypeScript + Tailwind CSS, pronta para deploy no Vercel — mesma base dos seus outros
projetos.
