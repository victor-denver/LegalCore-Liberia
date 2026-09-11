import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/** Personal law library: saved authorities, brief builder, launch watchlist, corrections.
 *  Everything is free — this store never gates features.
 *
 *  Storage model:
 *   • Always mirrored in localStorage so the app works fully signed-out / offline.
 *   • When signed in, changes are also written to Supabase and merged back on
 *     sign-in, so the library follows the user across devices. */
export interface BriefItem {
  key: string;
  docId: string;
  note: string;
  addedAt: string;
}
export interface WatchEntry {
  country: string;
  contact: string;
  date: string;
}
export interface Correction {
  docId: string;
  message: string;
  date: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

interface StoreValue {
  savedIds: string[];
  toggleSaved: (id: string) => 'saved' | 'removed';
  isSaved: (id: string) => boolean;
  brief: BriefItem[];
  addToBrief: (docId: string, note?: string) => 'added' | 'exists';
  removeFromBrief: (key: string) => void;
  updateBriefNote: (key: string, note: string) => void;
  moveBrief: (key: string, dir: -1 | 1) => void;
  clearBrief: () => void;
  watchlist: WatchEntry[];
  addWatch: (country: string, contact: string) => boolean;
  corrections: Correction[];
  addCorrection: (docId: string, message: string) => void;
  /** true while the signed-in user's cloud library is being merged in */
  syncing: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Fire-and-forget remote write; never blocks the UI, never throws. */
function remote(p: PromiseLike<{ error: { message: string } | null }> | undefined) {
  if (!p) return;
  Promise.resolve(p).then(({ error }) => { if (error) console.warn('[store] sync failed:', error.message); }, () => {});
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const [savedIds, setSavedIds] = useState<string[]>(() => read<string[]>('legalcore-saved', []));
  const [brief, setBrief] = useState<BriefItem[]>(() => read<BriefItem[]>('legalcore-brief', []));
  const [watchlist, setWatchlist] = useState<WatchEntry[]>(() => read<WatchEntry[]>('legalcore-watch', []));
  const [corrections, setCorrections] = useState<Correction[]>(() => read<Correction[]>('legalcore-corrections', []));
  const [syncing, setSyncing] = useState(false);

  useEffect(() => write('legalcore-saved', savedIds), [savedIds]);
  useEffect(() => write('legalcore-brief', brief), [brief]);
  useEffect(() => write('legalcore-watch', watchlist), [watchlist]);
  useEffect(() => write('legalcore-corrections', corrections), [corrections]);

  // Latest snapshot for callbacks (avoids stale closures without re-creating callbacks each render).
  const latest = useRef({ savedIds, brief, watchlist, corrections });
  latest.current = { savedIds, brief, watchlist, corrections };

  // ── Cloud merge on sign-in ─────────────────────────────────────────────
  const mergedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!supabase || !uid) { mergedFor.current = null; return; }
    if (mergedFor.current === uid) return;
    mergedFor.current = uid;
    const sb = supabase;
    let cancelled = false;

    (async () => {
      setSyncing(true);
      try {
        const local = latest.current;
        const [s, b, w, c] = await Promise.all([
          sb.from('saved_documents').select('doc_id').eq('user_id', uid),
          sb.from('brief_items').select('key, doc_id, note, position, added_at').eq('user_id', uid).order('position'),
          sb.from('watchlist').select('country, contact, created_at').eq('user_id', uid),
          sb.from('corrections').select('doc_id, message, created_at').eq('user_id', uid),
        ]);
        if (cancelled) return;

        // Saved: union; push local-only up.
        const cloudSaved = (s.data ?? []).map((r) => r.doc_id as string);
        const savedUp = local.savedIds.filter((id) => !cloudSaved.includes(id));
        if (savedUp.length) remote(sb.from('saved_documents').upsert(savedUp.map((doc_id) => ({ user_id: uid, doc_id })), { onConflict: 'user_id,doc_id' }));
        setSavedIds(Array.from(new Set([...cloudSaved, ...local.savedIds])));

        // Brief: union by key, cloud order first.
        const cloudBrief: BriefItem[] = (b.data ?? []).map((r) => ({ key: r.key as string, docId: r.doc_id as string, note: (r.note as string) ?? '', addedAt: r.added_at as string }));
        const cloudKeys = new Set(cloudBrief.map((x) => x.key));
        const cloudDocs = new Set(cloudBrief.map((x) => x.docId));
        const briefUp = local.brief.filter((x) => !cloudKeys.has(x.key) && !cloudDocs.has(x.docId));
        const mergedBrief = [...cloudBrief, ...briefUp];
        if (briefUp.length) remote(sb.from('brief_items').upsert(briefUp.map((x, i) => ({ key: x.key, user_id: uid, doc_id: x.docId, note: x.note, position: cloudBrief.length + i, added_at: x.addedAt })), { onConflict: 'user_id,key' }));
        setBrief(mergedBrief);

        // Watchlist: union by (country, contact).
        const cloudWatch: WatchEntry[] = (w.data ?? []).map((r) => ({ country: r.country as string, contact: r.contact as string, date: r.created_at as string }));
        const watchUp = local.watchlist.filter((x) => !cloudWatch.some((y) => y.country === x.country && y.contact === x.contact));
        if (watchUp.length) remote(sb.from('watchlist').upsert(watchUp.map((x) => ({ user_id: uid, country: x.country, contact: x.contact, created_at: x.date })), { onConflict: 'user_id,country,contact', ignoreDuplicates: true }));
        setWatchlist([...cloudWatch, ...watchUp]);

        // Corrections: union by (doc, message).
        const cloudCorr: Correction[] = (c.data ?? []).map((r) => ({ docId: r.doc_id as string, message: r.message as string, date: r.created_at as string }));
        const corrUp = local.corrections.filter((x) => !cloudCorr.some((y) => y.docId === x.docId && y.message === x.message));
        if (corrUp.length) remote(sb.from('corrections').insert(corrUp.map((x) => ({ user_id: uid, doc_id: x.docId, message: x.message, created_at: x.date }))));
        setCorrections([...cloudCorr, ...corrUp]);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => { cancelled = true; };
  }, [uid]);

  // ── Mutations (local first, then cloud if signed in) ───────────────────
  const toggleSaved = useCallback((id: string): 'saved' | 'removed' => {
    const removing = latest.current.savedIds.includes(id);
    setSavedIds((prev) => (removing ? prev.filter((x) => x !== id) : prev.includes(id) ? prev : [...prev, id]));
    if (supabase && uid) {
      remote(removing
        ? supabase.from('saved_documents').delete().match({ user_id: uid, doc_id: id })
        : supabase.from('saved_documents').upsert({ user_id: uid, doc_id: id }, { onConflict: 'user_id,doc_id' }));
    }
    return removing ? 'removed' : 'saved';
  }, [uid]);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const addToBrief = useCallback((docId: string, note = ''): 'added' | 'exists' => {
    const cur = latest.current.brief;
    if (cur.some((b) => b.docId === docId)) return 'exists';
    const item: BriefItem = { key: `${Date.now()}-${docId}`, docId, note, addedAt: new Date().toISOString() };
    setBrief((prev) => (prev.some((b) => b.docId === docId) ? prev : [...prev, item]));
    if (supabase && uid) remote(supabase.from('brief_items').upsert({ key: item.key, user_id: uid, doc_id: docId, note, position: cur.length, added_at: item.addedAt }, { onConflict: 'user_id,key' }));
    return 'added';
  }, [uid]);

  const removeFromBrief = useCallback((key: string) => {
    setBrief((p) => p.filter((b) => b.key !== key));
    if (supabase && uid) remote(supabase.from('brief_items').delete().match({ user_id: uid, key }));
  }, [uid]);

  const updateBriefNote = useCallback((key: string, note: string) => {
    setBrief((p) => p.map((b) => (b.key === key ? { ...b, note } : b)));
    if (supabase && uid) remote(supabase.from('brief_items').update({ note }).match({ user_id: uid, key }));
  }, [uid]);

  const moveBrief = useCallback((key: string, dir: -1 | 1) => {
    const prev = latest.current.brief;
    const i = prev.findIndex((b) => b.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= prev.length) return;
    const next = [...prev];
    [next[i], next[j]] = [next[j], next[i]];
    setBrief(next);
    if (supabase && uid) {
      remote(supabase.from('brief_items').upsert([
        { key: next[i].key, user_id: uid, doc_id: next[i].docId, note: next[i].note, position: i, added_at: next[i].addedAt },
        { key: next[j].key, user_id: uid, doc_id: next[j].docId, note: next[j].note, position: j, added_at: next[j].addedAt },
      ], { onConflict: 'user_id,key' }));
    }
  }, [uid]);

  const clearBrief = useCallback(() => {
    setBrief([]);
    if (supabase && uid) remote(supabase.from('brief_items').delete().eq('user_id', uid));
  }, [uid]);

  const addWatch = useCallback((country: string, contact: string): boolean => {
    const c = contact.trim();
    if (!c) return false;
    if (latest.current.watchlist.some((w) => w.country === country && w.contact === c)) return false;
    const entry: WatchEntry = { country, contact: c, date: new Date().toISOString() };
    setWatchlist((prev) => (prev.some((w) => w.country === country && w.contact === c) ? prev : [...prev, entry]));
    if (supabase && uid) remote(supabase.from('watchlist').upsert({ user_id: uid, country, contact: c }, { onConflict: 'user_id,country,contact', ignoreDuplicates: true }));
    return true;
  }, [uid]);

  const addCorrection = useCallback((docId: string, message: string) => {
    const m = message.trim();
    if (!m) return;
    setCorrections((p) => [...p, { docId, message: m, date: new Date().toISOString() }]);
    if (supabase && uid) remote(supabase.from('corrections').insert({ user_id: uid, doc_id: docId, message: m }));
  }, [uid]);

  return (
    <StoreContext.Provider
      value={{ savedIds, toggleSaved, isSaved, brief, addToBrief, removeFromBrief, updateBriefNote, moveBrief, clearBrief, watchlist, addWatch, corrections, addCorrection, syncing }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
