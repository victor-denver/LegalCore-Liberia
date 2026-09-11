-- ═══════════════════════════════════════════════════════════════════
-- 0005 — Let an admin delete an account from the console
--
-- Deleting a row from auth.users needs privileges the browser will never have.
-- Rather than ship a service-role key to the client (which would bypass RLS on
-- every table and hand over the whole database), this exposes one narrow
-- security-definer function that does exactly one thing and checks who is asking.
--
-- What a delete destroys, via the cascades already declared in 0001/0002:
--   profiles, saved_documents, brief_items, feature_interest  → deleted
--   feedback, corrections, document_requests, watchlist, events → user_id set null
-- So their personal library goes, while their feedback and your analytics survive
-- anonymously. Nothing here needs a manual cleanup pass.
--
-- Two guards, both enforced in the database rather than the UI, so they hold even
-- if someone calls the RPC directly with their own token:
--   • you cannot delete yourself  — that is how an admin locks themselves out
--   • you cannot delete an admin  — demote them to 'user' first, which makes
--     removing a colleague a deliberate two-step act instead of one click
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  victim_email text;
  victim_role  public.user_role;
begin
  if not public.is_admin() then
    raise exception 'Only admins may delete accounts';
  end if;

  if target = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  select email, role into victim_email, victim_role
  from public.profiles where id = target;

  if not found then
    raise exception 'That account no longer exists';
  end if;

  if victim_role = 'admin' then
    raise exception 'Demote this admin to user before deleting the account';
  end if;

  -- Cascades through public.profiles and the auth.* side tables (identities,
  -- sessions, refresh tokens), so the sign-in is revoked too, not just the profile.
  delete from auth.users where id = target;

  -- Audit trail. Attributed to the admin who acted, not the person removed.
  insert into public.events (user_id, session_id, name, props, path)
  values (
    auth.uid(),
    'admin-console',
    'user_deleted',
    jsonb_build_object('deleted_email', victim_email, 'deleted_id', target),
    '/admin'
  );
end;
$$;

-- Postgres grants EXECUTE to PUBLIC on new functions, which would expose this to
-- anonymous visitors. Take it back and hand it only to signed-in callers; is_admin()
-- above is what narrows it the rest of the way.
revoke execute on function public.admin_delete_user(uuid) from public;
revoke execute on function public.admin_delete_user(uuid) from anon;
grant  execute on function public.admin_delete_user(uuid) to authenticated;
