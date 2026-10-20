-- Rode uma vez no SQL Editor do Supabase.
-- 1) Para cada rede repetida, mantém um canal (o conectado, se houver) e move os posts pra ele.
-- 2) Apaga os repetidos.
-- 3) Cria o bloqueio pra não voltar a duplicar.

with ranqueado as (
  select id, usuario_id, rede,
         row_number() over (partition by usuario_id, rede order by conectado desc nulls last, id) as pos
  from canal
),
mapa as (
  select r.id as duplicado_id, k.id as manter_id
  from ranqueado r
  join ranqueado k on k.usuario_id = r.usuario_id and k.rede = r.rede and k.pos = 1
  where r.pos > 1
)
update postagem p set canal_id = m.manter_id
from mapa m where p.canal_id = m.duplicado_id;

with ranqueado as (
  select id, usuario_id, rede,
         row_number() over (partition by usuario_id, rede order by conectado desc nulls last, id) as pos
  from canal
)
delete from canal where id in (select id from ranqueado where pos > 1);

create unique index if not exists canal_usuario_rede_key on canal (usuario_id, rede);
