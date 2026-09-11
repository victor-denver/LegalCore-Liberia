-- ═══════════════════════════════════════════════════════════════════
-- 0004 — Sign-up gate for search and the AI
--
-- Adds one app_config row. The app already defaults this to true in code, so the
-- gate works before this migration runs; the row is what lets an admin turn it off
-- from /admin → Config without a redeploy.
--
-- Deliberately scoped to search + AI. Browsing and reading a document stay open so
-- shared links keep working and the library stays crawlable.
--
-- Note this is a UX gate, not an authorization boundary — the corpus ships inside
-- the client bundle. Row Level Security remains the only real boundary, and it
-- already covers everything that lives in Postgres.
-- ═══════════════════════════════════════════════════════════════════

insert into public.app_config (key, value) values
  ('auth_required', 'true'::jsonb)   -- flip in /admin → Config → Growth
on conflict (key) do nothing;
