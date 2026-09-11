/**
 * Soft login nudge — the site stays fully free & readable signed-out. After a few
 * document views we *invite* (never force) the visitor to create a free account so
 * their library syncs. Dismissal is remembered for a week.
 */
const VIEWS_KEY = 'legalcore-doc-views';
const DISMISS_KEY = 'legalcore-nudge-dismissed';
const DISMISS_DAYS = 7;

const EVT = 'legalcore:views';

export function bumpViewCount(): number {
  try {
    const n = Number(localStorage.getItem(VIEWS_KEY) || 0) + 1;
    localStorage.setItem(VIEWS_KEY, String(n));
    window.dispatchEvent(new CustomEvent(EVT, { detail: n }));
    return n;
  } catch { return 0; }
}
export function onViewCount(handler: (n: number) => void) {
  const h = (e: Event) => handler((e as CustomEvent<number>).detail);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
export function viewCount(): number {
  try { return Number(localStorage.getItem(VIEWS_KEY) || 0); } catch { return 0; }
}
export function dismissNudge() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
}
export function nudgeDismissed(): boolean {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return t > 0 && Date.now() - t < DISMISS_DAYS * 86_400_000;
  } catch { return false; }
}
