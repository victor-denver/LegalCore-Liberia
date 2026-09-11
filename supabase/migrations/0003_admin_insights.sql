-- ═══════════════════════════════════════════════════════════════
--  LegalCore — extra insight views for the admin overview
--  Requires 0002. Run in SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- When are people using LegalCore? (weekday × hour, last 30 days, in UTC)
create or replace view public.insights_activity_heatmap
  with (security_invoker = true) as
  select extract(dow  from created_at)::int as dow,     -- 0 = Sunday … 6 = Saturday
         extract(hour from created_at)::int as hour,    -- 0 … 23
         count(*)::int as events,
         count(distinct session_id)::int as sessions
  from public.events
  where created_at > now() - interval '30 days'
  group by 1, 2;

-- Everything that landed in the inbox, by day (feeds the admin calendar)
create or replace view public.insights_inbox_daily
  with (security_invoker = true) as
  select day, kind, count(*)::int as items from (
    select created_at::date as day, 'feedback'   as kind from public.feedback
    union all
    select created_at::date,        'request'    from public.document_requests
    union all
    select created_at::date,        'correction' from public.corrections
    union all
    select created_at::date,        'signup'     from public.profiles
  ) x
  where day > (now() - interval '90 days')::date
  group by 1, 2;
