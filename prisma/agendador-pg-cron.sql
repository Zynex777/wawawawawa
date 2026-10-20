-- Agendador: chama o app a cada 10 minutos pra publicar o que estiver na hora.
-- Antes: Supabase > Database > Extensions > ative "pg_cron" e "pg_net".
-- Troque SEU_CRON_SECRET pelo mesmo valor da variável CRON_SECRET no Vercel.

select cron.schedule(
  'publicar-agenda',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://multipost-afiliado.vercel.app/api/cron/publicar',
    headers := '{"x-cron-secret": "SEU_CRON_SECRET", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Para ver se está rodando:
-- select * from cron.job_run_details order by start_time desc limit 10;
