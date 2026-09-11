import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, type Profile } from '../lib/supabase';
import { callbackUrl, rememberNext } from '../lib/authRedirect';
import { setAnalyticsUser, track } from '../lib/analytics';

/**
 * Auth model
 *  • Everyone     → email + password (sign up / sign in / reset). One door, no role hints.
 *  • Google OAuth → wired up but hidden until app_config.google_login_enabled is true.
 *  • Role lives in `profiles.role`, set server-side. The client only reads it;
 *    RLS enforces it regardless of what the UI shows.
 */

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

interface AuthValue {
  enabled: boolean;
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  /** Email + password sign-up. `needsConfirmation` is true when the project requires email verification. */
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<{ error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Update own preferences (country, profession, organisation, onboarding flag). Role/plan are server-guarded. */
  updateProfile: (patch: Partial<Pick<Profile, 'country_code' | 'profession' | 'organization' | 'onboarding_done' | 'full_name'>>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'signed-out');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!supabase || !userId) { setProfile(null); return; }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) { console.warn('[auth] profile load failed', error.message); setProfile(null); return; }
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setAnalyticsUser(data.session?.user.id ?? null);
      setSession(data.session);
      setStatus(data.session ? 'signed-in' : 'signed-out');
      void loadProfile(data.session?.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setStatus(s ? 'signed-in' : 'signed-out');
      setAnalyticsUser(s?.user.id ?? null);
      if (event === 'SIGNED_IN' && s) {
        const isNew = Math.abs(new Date(s.user.created_at).getTime() - Date.now()) < 60_000;
        track(isNew ? 'sign_up' : 'sign_in', { provider: s.user.app_metadata?.provider });
      }
      // Defer to avoid deadlocks inside the auth callback (Supabase guidance).
      setTimeout(() => void loadProfile(s?.user.id), 0);
    });

    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    if (!supabase) return { error: 'Sign-in is not configured.' };
    rememberNext(redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl(),
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
    return error ? { error: error.message } : {};
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Sign-in is not configured.' };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    // Generic message — never reveal whether the email exists.
    return error ? { error: 'Incorrect email or password.' } : {};
  }, []);

  const signUpWithPassword = useCallback<AuthValue['signUpWithPassword']>(async (email, password, fullName) => {
    if (!supabase) return { error: 'Sign-in is not configured.' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() }, emailRedirectTo: callbackUrl() },
    });
    if (error) {
      // Don't leak whether an address is registered.
      if (/already|registered|exists/i.test(error.message)) return { error: 'Could not create the account. If you already have one, sign in instead.' };
      return { error: error.message };
    }
    // With "Confirm email" on, Supabase returns a user but no session until the link is clicked.
    return { needsConfirmation: !data.session };
  }, []);

  const signInWithMagicLink = useCallback(async (email: string, redirectTo?: string) => {
    if (!supabase) return { error: 'Sign-in is not configured.' };
    rememberNext(redirectTo);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl(), shouldCreateUser: false },
    });
    return error ? { error: error.message } : {};
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Sign-in is not configured.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(() => loadProfile(session?.user.id), [loadProfile, session?.user.id]);

  const updateProfile = useCallback<AuthValue['updateProfile']>(async (patch) => {
    const uid = session?.user.id;
    if (!supabase || !uid) return { error: 'Not signed in.' };
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', uid).select('*').single();
    if (error) return { error: error.message };
    setProfile(data as Profile);
    return {};
  }, [session?.user.id]);

  // Heartbeat: record last_seen once per session so admins can see active users.
  useEffect(() => {
    const uid = session?.user.id;
    if (!supabase || !uid) return;
    const key = `legalcore-seen-${uid}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    void supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', uid);
  }, [session?.user.id]);

  const value = useMemo<AuthValue>(() => ({
    enabled: isSupabaseConfigured,
    status,
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: profile?.role === 'admin',
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    sendPasswordReset,
    signOut,
    refreshProfile,
    updateProfile,
  }), [status, session, profile, signInWithGoogle, signInWithPassword, signUpWithPassword, signInWithMagicLink, sendPasswordReset, signOut, refreshProfile, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
