-- ═══════════════════════════════════════════════════════════════
--  LegalCore West Africa — Auth, roles & personal library
--  Run in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- ═══════════════════════════════════════════════════════════════

-- ─── Roles ───────────────────────────────────────────────────────
create type public.user_role as enum ('user', 'admin');

-- ─── Profiles (1:1 with auth.users) ──────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  role        public.user_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile whenever a user signs up (Google or email).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: is the current caller an admin? (security definer avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── Personal library tables ─────────────────────────────────────
create table public.saved_documents (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  doc_id    text not null,
  saved_at  timestamptz not null default now(),
  primary key (user_id, doc_id)
);

create table public.brief_items (
  key       text not null,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  doc_id    text not null,
  note      text not null default '',
  position  int  not null default 0,
  added_at  timestamptz not null default now(),
  primary key (user_id, key)
);

create table public.watchlist (
  id        bigint generated always as identity primary key,
  user_id   uuid references public.profiles(id) on delete set null,
  country   text not null,
  contact   text not null,
  created_at timestamptz not null default now(),
  unique (user_id, country, contact)
);

create table public.corrections (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles(id) on delete set null,
  doc_id     text not null,
  message    text not null check (length(message) between 1 and 4000),
  status     text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.corrections (status, created_at desc);
create index on public.watchlist (country);

-- ─── Row Level Security ──────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.saved_documents enable row level security;
alter table public.brief_items     enable row level security;
alter table public.watchlist       enable row level security;
alter table public.corrections     enable row level security;

-- profiles: users read/update their own row; admins read all.
-- NOTE: `role` is deliberately NOT updatable by the user — see trigger below.
create policy "profiles: read own"        on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles: update own"      on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: admin update"    on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- Prevent a non-admin from escalating their own role.
create or replace function public.protect_role_column()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- auth.uid() is null for the SQL editor / service role, which are trusted.
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins may change roles';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute procedure public.protect_role_column();

-- saved_documents / brief_items: strictly per-user.
create policy "saved: own rows" on public.saved_documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "brief: own rows" on public.brief_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- watchlist: users manage their own; admins can read everything.
create policy "watch: own rows"   on public.watchlist for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watch: admin read" on public.watchlist for select using (public.is_admin());

-- corrections: users create + read their own; admins read/update all.
create policy "corr: insert own"   on public.corrections for insert with check (auth.uid() = user_id);
create policy "corr: read own"     on public.corrections for select using (auth.uid() = user_id or public.is_admin());
create policy "corr: admin update" on public.corrections for update using (public.is_admin()) with check (public.is_admin());

-- ─── Grant an admin ──────────────────────────────────────────────
-- After the admin has signed in once (so their profile row exists), run:
--   update public.profiles set role = 'admin' where email = 'admin@yourdomain.com';
