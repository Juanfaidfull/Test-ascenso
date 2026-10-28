-- ASCENSO 4.1 · esquema de Supabase (proyecto ascenso-juego)
-- Seguridad: RLS en todas las tablas. El juego sólo usa la URL y la clave ANON (pública).
-- Nunca la service_role. El ranking se lee sin cuenta; sólo las cuentas registran puntuaciones.
-- Este mismo texto está aplicado en el proyecto. Si recreas el proyecto, ejecútalo entero en SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique check (char_length(username) between 3 and 16 and username ~ '^[A-Za-z0-9_]+$'),
  created_at timestamptz default now()
);

create table if not exists public.game_saves (
  user_id uuid primary key references auth.users on delete cascade,
  best_score integer not null default 0 check (best_score between 0 and 10000000),
  best_height integer not null default 0 check (best_height between 0 and 100000),
  total_kills integer not null default 0 check (total_kills between 0 and 100000000),
  total_bosses integer not null default 0 check (total_bosses between 0 and 1000000),
  runs integer not null default 0 check (runs between 0 and 100000000),
  settings jsonb not null default '{}'::jsonb,
  hero_config jsonb not null default '{}'::jsonb,
  unlocks jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  username text not null check (char_length(username) between 3 and 16),
  score integer not null check (score between 0 and 10000000),
  height integer not null check (height between 0 and 100000),
  kills integer not null check (kills between 0 and 100000),
  bosses integer not null check (bosses between 0 and 1000),
  created_at timestamptz default now()
);
create index if not exists scores_score_idx on public.scores (score desc);
create index if not exists scores_user_idx on public.scores (user_id);

alter table public.profiles enable row level security;
alter table public.game_saves enable row level security;
alter table public.scores enable row level security;

drop policy if exists "perfil: leer propio" on public.profiles;
create policy "perfil: leer propio" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "perfil: crear propio" on public.profiles;
create policy "perfil: crear propio" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "perfil: actualizar propio" on public.profiles;
create policy "perfil: actualizar propio" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "guardado: leer propio" on public.game_saves;
create policy "guardado: leer propio" on public.game_saves for select to authenticated using (auth.uid() = user_id);
drop policy if exists "guardado: crear propio" on public.game_saves;
create policy "guardado: crear propio" on public.game_saves for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "guardado: actualizar propio" on public.game_saves;
create policy "guardado: actualizar propio" on public.game_saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ranking: leer" on public.scores;
create policy "ranking: leer" on public.scores for select to authenticated using (true);
drop policy if exists "ranking: leer (público)" on public.scores;
create policy "ranking: leer (público)" on public.scores for select to anon using (true);
drop policy if exists "ranking: insertar propia" on public.scores;
create policy "ranking: insertar propia" on public.scores for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.profiles, public.game_saves, public.scores from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.game_saves to authenticated;
grant select, insert on public.scores to authenticated;
grant select on public.scores to anon;
grant usage, select on sequence public.scores_id_seq to authenticated;

-- Puntuación plausible: corta valores imposibles (no es un anticheat completo)
create or replace function public.scores_plausible()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.score > new.height * 10 + new.kills * 120 + new.bosses * 300 + 2000 then
    raise exception 'puntuación no válida' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke execute on function public.scores_plausible() from public, anon, authenticated;
drop trigger if exists scores_plausible_trg on public.scores;
create trigger scores_plausible_trg before insert on public.scores
  for each row execute function public.scores_plausible();

-- Perfil automático al crear una cuenta. Si el nombre ya existe, se usa uno propio (la cuenta no falla).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uname text := coalesce(new.raw_user_meta_data ->> 'username', '');
begin
  if uname !~ '^[A-Za-z0-9_]{3,16}$' or exists (select 1 from public.profiles p where p.username = uname) then
    uname := 'jugador_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, username) values (new.id, uname) on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
