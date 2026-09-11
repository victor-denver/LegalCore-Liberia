import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase browser client.
 *
 * The project connection is built in, so a fresh clone or a brand-new deployment
 * works with no configuration at all — sign-in behaves the same on localhost as it
 * does in production. Environment variables still take precedence when present,
 * which is how a build gets pointed at a different project.
 *
 * Why hard-coding these is safe: both values are public by design. The publishable
 * key carries no privileges — every request made with it is still evaluated by Row
 * Level Security as the anonymous or signed-in user. It is compiled into the
 * JavaScript that every visitor downloads either way, so keeping it here is no more
 * exposed than keeping it in a VITE_ variable. The protection is RLS, not secrecy.
 *
 * NEVER put the secret / service-role key here, or in any VITE_ variable. That one
 * bypasses RLS completely and would hand over the whole database.
 */
const DEFAULT_URL = 'https://tmwxbdhoulgrxabmutbh.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_bHD9MkmTnGilPDCwlJTgQQ_Y5BrUOcZ';

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const envKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim();

// A trailing slash breaks the REST paths, so normalise whatever we were handed.
const url = (envUrl || DEFAULT_URL).replace(/\/+$/, '');
const key = envKey || DEFAULT_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key && !url.includes('YOUR-PROJECT-REF'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        // PKCE is the recommended OAuth flow for browser SPAs.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn('[LegalCore] Supabase is not configured. Running in local-only mode — the law is still searchable, but accounts and cloud sync are off.');
}

/** Roles are assigned server-side (profiles.role). Never trust a role stored on the client. */
export type UserRole = 'user' | 'admin';

export type Plan = 'free' | 'pro' | 'firm';
export type Profession = 'lawyer' | 'judge' | 'student' | 'business' | 'government' | 'ngo' | 'citizen' | 'other';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  /** Preferred jurisdiction (ISO-2). Drives default country, ranking and AI voice. */
  country_code: string;
  profession: Profession | null;
  organization: string | null;
  /** Billing tier. Everything is free today; this exists so gating can be flipped on later without a rewrite. */
  plan: Plan;
  onboarding_done: boolean;
  last_seen_at: string | null;
  created_at: string;
}

/** Remote config keys (public.app_config). Flip in the admin console — no redeploy needed. */
export interface AppConfig {
  paywall_enabled: boolean;
  announcement: { text: string; href?: string; tone?: 'info' | 'gold' | 'red' } | null;
  nudge_after_views: number;
  /** Show "Continue with Google" on the login page. Off until the Google OAuth client is configured. */
  google_login_enabled: boolean;
}
export const DEFAULT_CONFIG: AppConfig = { paywall_enabled: false, announcement: null, nudge_after_views: 3, google_login_enabled: false };
