-- Appreton — Moderacion automatica de reseñas
-- Ejecutar en Supabase Dashboard → SQL Editor

alter table reviews
  add column if not exists moderation_status text default 'visible';

alter table reviews
  drop constraint if exists reviews_moderation_status_check;

alter table reviews
  add constraint reviews_moderation_status_check
  check (moderation_status in ('visible', 'pending_review', 'hidden'));

create index if not exists reviews_moderation_status_idx
  on reviews (moderation_status)
  where moderation_status != 'visible';
