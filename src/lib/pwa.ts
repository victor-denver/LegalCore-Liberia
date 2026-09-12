/**
 * Progressive-web-app plumbing: service-worker registration, update detection and
 * the install prompt.
 *
 * Kept out of React so registration happens once per page load regardless of how
 * the tree re-renders, and so the `beforeinstallprompt` event — which fires early,
 * often before the app has mounted — is never missed.
 */

const SW_URL = '/sw.js';

/* ── Install prompt ───────────────────────────────────────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(available: boolean) => void>();

function emitInstall() {
  const available = deferredPrompt !== null;
  installListeners.forEach((fn) => fn(available));
}

export function onInstallAvailable(fn: (available: boolean) => void) {
  installListeners.add(fn);
  return () => { installListeners.delete(fn); };
}

export function canInstall() {
  return deferredPrompt !== null;
}

/** True when already running as an installed app, so we never pitch the install. */
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS Safari predates display-mode and reports this instead.
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

/**
 * iOS Safari never fires `beforeinstallprompt`, so there is no button to offer —
 * those users have to go through the Share sheet and need telling how.
 */
export function isIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Returns the user's choice, or null if there was nothing to show. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | null> {
  const evt = deferredPrompt;
  if (!evt) return null;
  // The event is single-use; drop it before awaiting so a double click cannot reuse it.
  deferredPrompt = null;
  emitInstall();
  await evt.prompt();
  const { outcome } = await evt.userChoice;
  return outcome;
}

/* ── Update prompt ────────────────────────────────────────────────── */

let waiting: ServiceWorker | null = null;
const updateListeners = new Set<(ready: boolean) => void>();

export function onUpdateReady(fn: (ready: boolean) => void) {
  updateListeners.add(fn);
  return () => { updateListeners.delete(fn); };
}

function emitUpdate() {
  const ready = waiting !== null;
  updateListeners.forEach((fn) => fn(ready));
}

/** Activates the waiting worker. The controllerchange handler reloads the page. */
export function applyUpdate() {
  waiting?.postMessage('SKIP_WAITING');
}

/* ── Registration ─────────────────────────────────────────────────── */

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // In dev the worker would cache modules and fight Vite's HMR. Clean up any
  // worker left over from a production build served on the same origin.
  if (import.meta.env.DEV) {
    void navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => void r.unregister()));
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    // Suppress the browser's own mini-infobar; we show our own card instead.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    emitInstall();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emitInstall();
  });

  const start = () => {
    void navigator.serviceWorker
      .register(SW_URL, { scope: '/' })
      .then((reg) => {
        if (reg.waiting) { waiting = reg.waiting; emitUpdate(); }

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            // A worker that reaches "installed" while another controls the page is
            // a genuine update. Without a controller it is the very first install,
            // which needs no prompt.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              waiting = installing;
              emitUpdate();
            }
          });
        });

        // Catch a version published while the tab sat open.
        window.setInterval(() => void reg.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch(() => { /* offline or unsupported — the app works regardless */ });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  };

  // Registering after load keeps the worker off the critical path. If load has
  // already fired by the time this runs, the listener would never fire at all.
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
