-- Appreton — Limpieza retroactiva de XP/contadores por bug del flujo
--
-- PROBLEMA: reviews con moderation_status = 'pending_review' ya dieron
-- XP y contadores al usuario antes de que el extractor las filtrara.
-- Este script revierte esos efectos.
--
-- NO ejecutar sin revisar primero cuantas reviews afecta:
--
-- SELECT COUNT(*) FROM reviews WHERE moderation_status = 'pending_review';
-- SELECT user_id, COUNT(*) FROM reviews WHERE moderation_status = 'pending_review' GROUP BY user_id;
--
-- Si el numero es razonable, ejecuta:

begin;

-- 1. Restar 20 XP y 1 review por cada opinion oculta del usuario
with rejected_per_user as (
  select user_id, count(*) as n
  from reviews
  where moderation_status = 'pending_review'
    and user_id is not null
  group by user_id
)
update user_profiles p
set
  xp = greatest(0, (p.xp - r.n * 20)),
  total_reviews = greatest(0, (p.total_reviews - r.n))
from rejected_per_user r
where p.id = r.user_id;

-- 2. Recalcular avg_rating y review_count de cada place excluyendo
--    reviews ocultas
update places pl
set
  avg_rating = coalesce((
    select round(avg(rating)::numeric, 1)
    from reviews
    where place_id = pl.id
      and (moderation_status = 'visible' or moderation_status is null)
  ), 0),
  review_count = (
    select count(*)
    from reviews
    where place_id = pl.id
      and (moderation_status = 'visible' or moderation_status is null)
  );

commit;

-- Verificar resultado:
-- SELECT id, xp, total_reviews FROM user_profiles ORDER BY xp DESC;
