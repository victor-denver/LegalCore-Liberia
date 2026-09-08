import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';

/** Personal law library: saved authorities, brief builder, launch watchlist, corrections.
 *  Everything is free — this store never gates features. */
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
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>(() => read<string[]>('legalcore-saved', []));
  const [brief, setBrief] = useState<BriefItem[]>(() => read<BriefItem[]>('legalcore-brief', []));
  const [watchlist, setWatchlist] = useState<WatchEntry[]>(() => read<WatchEntry[]>('legalcore-watch', []));
  const [corrections, setCorrections] = useState<Correction[]>(() => read<Correction[]>('legalcore-corrections', []));

  useEffect(() => write('legalcore-saved', savedIds), [savedIds]);
  useEffect(() => write('legalcore-brief', brief), [brief]);
  useEffect(() => write('legalcore-watch', watchlist), [watchlist]);
  useEffect(() => write('legalcore-corrections', corrections), [corrections]);

  const toggleSaved = useCallback((id: string): 'saved' | 'removed' => {
    let result: 'saved' | 'removed' = 'saved';
    setSavedIds((prev) => {
      if (prev.includes(id)) {
        result = 'removed';
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
    return result;
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const addToBrief = useCallback((docId: string, note = ''): 'added' | 'exists' => {
    let result: 'added' | 'exists' = 'added';
    setBrief((prev) => {
      if (prev.some((b) => b.docId === docId)) {
        result = 'exists';
        return prev;
      }
      return [...prev, { key: `${Date.now()}-${docId}`, docId, note, addedAt: new Date().toISOString() }];
    });
    return result;
  }, []);

  const removeFromBrief = useCallback((key: string) => setBrief((p) => p.filter((b) => b.key !== key)), []);
  const updateBriefNote = useCallback((key: string, note: string) => setBrief((p) => p.map((b) => (b.key === key ? { ...b, note } : b))), []);
  const moveBrief = useCallback((key: string, dir: -1 | 1) => {
    setBrief((prev) => {
      const i = prev.findIndex((b) => b.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);
  const clearBrief = useCallback(() => setBrief([]), []);

  const addWatch = useCallback((country: string, contact: string): boolean => {
    const c = contact.trim();
    if (!c) return false;
    let added = false;
    setWatchlist((prev) => {
      if (prev.some((w) => w.country === country && w.contact === c)) return prev;
      added = true;
      return [...prev, { country, contact: c, date: new Date().toISOString() }];
    });
    return added;
  }, []);

  const addCorrection = useCallback((docId: string, message: string) => {
    if (!message.trim()) return;
    setCorrections((p) => [...p, { docId, message: message.trim(), date: new Date().toISOString() }]);
  }, []);

  return (
    <StoreContext.Provider
      value={{ savedIds, toggleSaved, isSaved, brief, addToBrief, removeFromBrief, updateBriefNote, moveBrief, clearBrief, watchlist, addWatch, corrections, addCorrection }}
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
