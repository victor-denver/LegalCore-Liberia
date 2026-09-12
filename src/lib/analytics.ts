import { supabase } from './supabase';
import { JURISDICTION_STORAGE_KEY } from '../data/jurisdictions';

/**
 * Privacy-light product analytics.
 *  • No IP, no fingerprinting, no third-party script. Rows go straight to `public.events`.
 *  • Anonymous session id lives in sessionStorage (dies with the tab).
 *  • Batched: flushed every few seconds, on tab hide, and on unload.
 *  • Silent no-op when Supabase isn't configured.
 *
 * Why it matters for the business: the admin "Insights" tab turns these rows into
 * "what are people searching for that we don't have", "which country is growing",
 * "which docs get exported" — i.e. what to build and where to charge.
 */

export type EventName =
  | 'page_view'
  | 'search'
  | 'doc_view'
  | 'doc_export'
  | 'doc_save'
  | 'ai_query'
  | 'compare'
  | 'sign_in'
  | 'sign_up'
  | 'feedback_sent'
  | 'law_requested'
  | 'feature_interest'
  | 'nudge_shown'
  | 'nudge_clicked'
  | 'auth_gate_shown'
  | 'pwa_installed'
  | 'pwa_install_dismissed'
  | 'country_changed'
  /** Written by the admin_delete_user function, not the client — listed so the
   *  event vocabulary in the database is documented in one place. */
  | 'user_deleted';

interface Row {
  user_id: string | null;
  session_id: string;
  name: EventName;
  props: Record<string, unknown>;
  country: string | null;
  path: string;
  created_at: string;
}

const SESSION_KEY = 'legalcore-sid';
const FLUSH_MS = 4000;
const MAX_BATCH = 40;

const queue: Row[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let currentUserId: string | null = null;
let started = false;

function sessionId(): string {
  try {
    let v = sessionStorage.getItem(SESSION_KEY);
    if (!v) {
      v = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem(SESSION_KEY, v);
    }
    return v;
  } catch {
    return 'no-storage';
  }
}

function country(): string | null {
  try { return localStorage.getItem(JURISDICTION_STORAGE_KEY); } catch { return null; }
}

/** Called by AuthProvider so rows are attributed to the signed-in user. */
export function setAnalyticsUser(userId: string | null) {
  currentUserId = userId;
}

export async function flush() {
  if (!supabase || queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  const { error } = await supabase.from('events').insert(batch);
  if (error && import.meta.env.DEV) console.warn('[analytics] flush failed:', error.message);
  if (queue.length) schedule();
}

function schedule() {
  if (timer) return;
  timer = setTimeout(() => { timer = null; void flush(); }, FLUSH_MS);
}

function ensureStarted() {
  if (started || typeof window === 'undefined') return;
  started = true;
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void flush(); });
  window.addEventListener('pagehide', () => { void flush(); });
}

/** Fire-and-forget. Safe to call anywhere, including render-adjacent effects. */
export function track(name: EventName, props: Record<string, unknown> = {}) {
  if (!supabase) return;
  ensureStarted();
  // Keep payloads small + non-sensitive.
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null) continue;
    clean[k] = typeof v === 'string' ? v.slice(0, 300) : v;
  }
  queue.push({
    user_id: currentUserId,
    session_id: sessionId(),
    name,
    props: clean,
    country: country(),
    path: window.location.pathname,
    created_at: new Date().toISOString(),
  });
  if (queue.length >= MAX_BATCH) void flush(); else schedule();
}
