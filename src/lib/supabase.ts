import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase browser client.
 *
 * Both values are public by design (the publishable key is protected by Row Level
 * Security). Secrets like the service-role key must NEVER be put in VITE_* vars.
 *
 * If the env vars are missing (e.g. a fresh clone), the app still runs — auth and
 * cloud sync simply switch off and the UI falls back to local-only mode.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key && !url.includes('YOUR-PROJECT-REF'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, key!, {
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
  console.warn('[LegalCore] Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local. Running in local-only mode.');
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
