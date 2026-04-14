-- ============================================================
-- APPRETON - Supabase setup
-- Ejecuta esto en Supabase > SQL Editor > New query
-- ============================================================

-- Tabla de sitios (banos)
create table if not exists places (
  id text primary key,
  name text not null,
  type text not null default 'otro',
  address text not null default '',
  latitude float,
  longitude float,
  avg_rating float default 0,
  review_count int default 0,
  created_at timestamp with time zone default now()
);

-- Tabla de opiniones
create table if not exists reviews (
  id text primary key,
  place_id text references places(id) on delete cascade,
  user_id text,
  rating float not null,
  comment text not null default '',
  has_paper boolean default false,
  has_soap boolean default false,
  has_brush boolean default false,
  required_order boolean,
  extras text[] default '{}',
  date text,
  created_at timestamp with time zone default now()
);

-- Una opinion por usuario y sitio (los usuarios anonimos con user_id NULL
-- pueden tener varias porque Postgres trata NULL como distinto en unique).
alter table reviews
  drop constraint if exists reviews_user_place_unique;
alter table reviews
  add constraint reviews_user_place_unique unique (user_id, place_id);

-- Tabla de perfiles de usuario (para ranking global)
create table if not exists user_profiles (
  id text primary key,
  display_name text,
  email text,
  provider text,
  avatar_type text default 'poop_1',
  custom_avatar_uri text,
  level int default 1,
  xp int default 0,
  total_reviews int default 0,
  join_date text,
  profile_completed boolean default false,
  gender text,
  is_sample boolean default false,
  last_review_date text,
  current_streak int default 0
);

-- Migracion para instalaciones existentes (idempotente)
alter table user_profiles
  add column if not exists last_review_date text;
alter table user_profiles
  add column if not exists current_streak int default 0;

-- Politicas de acceso publico (lectura y escritura para todos)
alter table places enable row level security;
alter table reviews enable row level security;
alter table user_profiles enable row level security;

create policy "Lectura publica places" on places for select using (true);
create policy "Escritura publica places" on places for insert with check (true);
create policy "Update places" on places for update using (true);

create policy "Lectura publica reviews" on reviews for select using (true);
create policy "Escritura publica reviews" on reviews for insert with check (true);

create policy "Lectura publica users" on user_profiles for select using (true);
create policy "Escritura publica users" on user_profiles for insert with check (true);
create policy "Update users" on user_profiles for update using (true);
