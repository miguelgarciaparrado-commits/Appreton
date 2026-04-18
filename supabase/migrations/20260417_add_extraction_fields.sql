-- Appreton — Migracion v1 extractor estructurado de reseñas
-- Ejecutar manualmente desde Supabase Dashboard → SQL Editor
-- NO ejecutar en produccion sin antes probar en staging.
--
-- Aplicar despues de las columnas gender + author_name (ya existen si
-- seguiste el README actualizado).

-- ─────────────────────────────────────────────────────────────
-- 1. Columnas de extraccion en reviews
-- ─────────────────────────────────────────────────────────────

alter table reviews
  add column if not exists structured_extraction jsonb,
  add column if not exists extracted_at timestamptz,
  add column if not exists extraction_version text,
  add column if not exists extraction_error text,
  add column if not exists extraction_status text default 'pending';

-- Constraint: valores validos para extraction_status
alter table reviews
  drop constraint if exists reviews_extraction_status_check;

alter table reviews
  add constraint reviews_extraction_status_check
  check (extraction_status in ('pending', 'processing', 'done', 'failed'));

-- ─────────────────────────────────────────────────────────────
-- 2. Indices para rendimiento
-- ─────────────────────────────────────────────────────────────

-- Para buscar pendientes rapido (backfill, reintento)
create index if not exists reviews_extraction_status_idx
  on reviews (extraction_status)
  where extraction_status in ('pending', 'processing', 'failed');

-- Para consultas por fecha de extraccion (tracking)
create index if not exists reviews_extracted_at_idx
  on reviews (extracted_at desc nulls last);

-- ─────────────────────────────────────────────────────────────
-- 3. Comentarios para documentar el schema
-- ─────────────────────────────────────────────────────────────

comment on column reviews.structured_extraction is
  'JSON con dimensiones extraidas por el agente Claude: cleanliness, supplies, accessibility, smell, privacy, safety, tags, overall_sentiment, flags.';

comment on column reviews.extracted_at is
  'Timestamp de la ultima extraccion exitosa.';

comment on column reviews.extraction_version is
  'Version del prompt del extractor (ej: "v1"). Para reprocesar si cambia el prompt.';

comment on column reviews.extraction_error is
  'Mensaje de error de la ultima extraccion fallida. Null si ok o nunca se intento.';

comment on column reviews.extraction_status is
  'Estado de la extraccion: pending (nueva), processing (en curso), done (exito), failed (error).';

-- ─────────────────────────────────────────────────────────────
-- 4. Backfill: marca reviews existentes como pending para extraccion
-- ─────────────────────────────────────────────────────────────
-- Descomentar si quieres que las reviews existentes entren a la cola:
--
-- update reviews
--   set extraction_status = 'pending'
--   where extraction_status is null
--     and (structured_extraction is null or extraction_version is null);

-- ─────────────────────────────────────────────────────────────
-- 5. Verificacion post-aplicacion
-- ─────────────────────────────────────────────────────────────
-- Despues de ejecutar, correr estos SELECTs para verificar:
--
-- SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'reviews'
--     AND column_name IN ('structured_extraction', 'extracted_at', 'extraction_version', 'extraction_error', 'extraction_status');
--
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'reviews';
