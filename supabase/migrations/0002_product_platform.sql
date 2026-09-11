-- ═══════════════════════════════════════════════════════════════
--  LegalCore West Africa — Product platform
--  Country preference · Feedback · Law requests · Analytics ·
--  Pro-feature demand signal · Remote config
--  Requires 0001_auth_and_library.sql. Run in SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- ─── Profile preferences (drives country-optimised experience) ───
alter table public.profiles
  add column if not exists country_code    text not null default 'LR',
  add column if not exists profession      text check (profession in ('lawyer','judge','student','business','government','ngo','citizen','other')),
  add column if not exists organization    text,
  add column if not exists plan            text not null default 'free' check (plan in ('free','pro','firm')),
  add column if not exists onboarding_done boolean not null default false,
  add column if not exists last_seen_at    timestamptz;

-- Users may update their own preferences, but never `plan` (billing) or `role`.
create or replace function public.protect_role_column()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then raise exception 'Only admins may change roles'; end if;
    if new.plan is distinct from old.plan then raise exception 'Plan is managed by billing'; end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- ─── Feedback (any page, any user) ──────────────────────────────
create table if not exists public.feedback (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  kind        text not null check (kind in ('bug','idea','praise','content','other')),
  rating      smallint check (rating between 1 and 5),
  message     text not null check (length(message) between 2 and 4000),
  page        text,
  country     text,
  status      text not null default 'new' check (status in ('new','seen','planned','done','closed')),
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists feedback_status_idx on public.feedback (status, created_at desc);

-- ─── Requests for laws we don't have yet (content roadmap) ──────
create table if not exists public.document_requests (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  country     text not null,
  title       text not null check (length(title) between 2 and 300),
  details     text,
  query       text,                       -- the search that returned nothing
  status      text not null default 'open' check (status in ('open','sourcing','added','declined')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists document_requests_country_idx on public.document_requests (country, status);

-- ─── Product analytics (privacy-light: no IP, no fingerprint) ────
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  session_id  text not null,
  name        text not null,
  props       jsonb not null default '{}'::jsonb,
  country     text,
  path        text,
  created_at  timestamptz not null default now()
);
create index if not exists events_name_time_idx on public.events (name, created_at desc);
create index if not exists events_time_idx on public.events (created_at desc);

-- ─── "I'd pay for this" — validates Pro features before building ─
create table if not exists public.feature_interest (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  feature_key text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, feature_key)
);

-- ─── Remote config / feature flags (flip without redeploying) ────
create table if not exists public.app_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
insert into public.app_config (key, value) values
  ('paywall_enabled', 'false'::jsonb),
  ('announcement',    'null'::jsonb),
  ('nudge_after_views', '3'::jsonb),
  ('google_login_enabled', 'false'::jsonb)   -- flip to true in /admin → Config once Google OAuth is set up
on conflict (key) do nothing;

-- ─── RLS ─────────────────────────────────────────────────────────
alter table public.feedback          enable row level security;
alter table public.document_requests enable row level security;
alter table public.events            enable row level security;
alter table public.feature_interest  enable row level security;
alter table public.app_config        enable row level security;

-- feedback: signed-in users create + read own; admins read/update all
drop policy if exists "fb: insert own" on public.feedback;
drop policy if exists "fb: read own or admin" on public.feedback;
drop policy if exists "fb: admin update" on public.feedback;
create policy "fb: insert own"         on public.feedback for insert to authenticated with check (auth.uid() = user_id);
create policy "fb: read own or admin"  on public.feedback for select using (auth.uid() = user_id or public.is_admin());
create policy "fb: admin update"       on public.feedback for update using (public.is_admin()) with check (public.is_admin());

-- document_requests: same shape
drop policy if exists "dr: insert own" on public.document_requests;
drop policy if exists "dr: read own or admin" on public.document_requests;
drop policy if exists "dr: admin update" on public.document_requests;
create policy "dr: insert own"         on public.document_requests for insert to authenticated with check (auth.uid() = user_id);
create policy "dr: read own or admin"  on public.document_requests for select using (auth.uid() = user_id or public.is_admin());
create policy "dr: admin update"       on public.document_requests for update using (public.is_admin()) with check (public.is_admin());

-- events: anyone (incl. anonymous) may write; only admins read
drop policy if exists "ev: insert" on public.events;
drop policy if exists "ev: admin read" on public.events;
create policy "ev: insert"      on public.events for insert to anon, authenticated with check (user_id is null or user_id = auth.uid());
create policy "ev: admin read"  on public.events for select using (public.is_admin());

-- feature_interest: own rows; admins read all
drop policy if exists "fi: own" on public.feature_interest;
drop policy if exists "fi: admin read" on public.feature_interest;
create policy "fi: own"         on public.feature_interest for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fi: admin read"  on public.feature_interest for select using (public.is_admin());

-- app_config: everyone reads; admins write
drop policy if exists "cfg: read" on public.app_config;
drop policy if exists "cfg: admin write" on public.app_config;
create policy "cfg: read"        on public.app_config for select to anon, authenticated using (true);
create policy "cfg: admin write" on public.app_config for all using (public.is_admin()) with check (public.is_admin());

-- ─── Insight views (security_invoker ⇒ RLS still applies ⇒ admin-only) ─
create or replace view public.insights_top_searches
  with (security_invoker = true) as
  select lower(props->>'q') as query, count(*)::int as searches,
         avg((props->>'results')::numeric)::numeric(10,1) as avg_results,
         max(created_at) as last_seen
  from public.events
  where name = 'search' and created_at > now() - interval '30 days' and coalesce(props->>'q','') <> ''
  group by 1 order by 2 desc limit 100;

create or replace view public.insights_zero_result_searches
  with (security_invoker = true) as
  select lower(props->>'q') as query, coalesce(country,'?') as country, count(*)::int as searches, max(created_at) as last_seen
  from public.events
  where name = 'search' and (props->>'results')::int = 0 and created_at > now() - interval '30 days'
  group by 1, 2 order by 3 desc limit 100;

create or replace view public.insights_top_documents
  with (security_invoker = true) as
  select props->>'doc_id' as doc_id, count(*)::int as views,
         count(distinct session_id)::int as sessions,
         sum(case when name = 'doc_export' then 1 else 0 end)::int as exports
  from public.events
  where name in ('doc_view','doc_export') and created_at > now() - interval '30 days'
  group by 1 order by 2 desc limit 100;

create or replace view public.insights_country_activity
  with (security_invoker = true) as
  select coalesce(country,'?') as country,
         count(*)::int as events,
         count(distinct session_id)::int as sessions,
         count(distinct user_id)::int as users,
         sum(case when name='search' then 1 else 0 end)::int as searches,
         sum(case when name='doc_view' then 1 else 0 end)::int as doc_views,
         sum(case when name='ai_query' then 1 else 0 end)::int as ai_queries
  from public.events
  where created_at > now() - interval '30 days'
  group by 1 order by 2 desc;

create or replace view public.insights_feature_interest
  with (security_invoker = true) as
  select feature_key, count(*)::int as votes, max(created_at) as last_vote
  from public.feature_interest group by 1 order by 2 desc;

create or replace view public.insights_daily
  with (security_invoker = true) as
  select date_trunc('day', created_at)::date as day,
         count(distinct session_id)::int as sessions,
         count(distinct user_id)::int as signed_in_users,
         sum(case when name='search' then 1 else 0 end)::int as searches,
         sum(case when name='doc_view' then 1 else 0 end)::int as doc_views,
         sum(case when name='ai_query' then 1 else 0 end)::int as ai_queries
  from public.events
  where created_at > now() - interval '30 days'
  group by 1 order by 1 desc;

-- ─── Housekeeping: keep the events table lean ────────────────────
-- Optional: enable pg_cron in Dashboard → Integrations, then:
--   select cron.schedule('purge-old-events', '0 3 * * *',
--     $$delete from public.events where created_at < now() - interval '180 days'$$);
