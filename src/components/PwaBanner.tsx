import { useEffect, useState } from 'react';
import { Download, X, RefreshCw, Share, Plus } from 'lucide-react';
import { canInstall, onInstallAvailable, promptInstall, isStandalone, isIos, onUpdateReady, applyUpdate } from '../lib/pwa';
import { track } from '../lib/analytics';
import './PwaBanner.css';

const DISMISS_KEY = 'legalcore-install-dismissed';

function dismissed(): boolean {
  try {
    const until = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() < until;
  } catch {
    return false;
  }
}

/** Snooze rather than suppress forever — they may want the app later. */
function snooze(days: number) {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 86_400_000));
  } catch { /* private mode — it just reappears next visit */ }
}

/**
 * Two prompts, one at a time, both out of the way of the AI dock and the mobile
 * tab bar:
 *  • a new version is cached and waiting  → offer a reload (takes priority)
 *  • the app can be installed             → offer to install it
 *
 * Neither ever blocks the page.
 */
export default function PwaBanner() {
  const [installable, setInstallable] = useState(canInstall);
  const [updateReady, setUpdateReady] = useState(false);
  const [hidden, setHidden] = useState(dismissed);
  const [busy, setBusy] = useState(false);

  useEffect(() => onInstallAvailable(setInstallable), []);
  useEffect(() => onUpdateReady(setUpdateReady), []);

  if (updateReady) {
    return (
      <div className="pwa pwa--update" role="status">
        <RefreshCw size={15} className="pwa__ico" />
        <div className="pwa__text">
          <strong>A new version is ready.</strong>
          <span>Reload to get the latest law and fixes.</span>
        </div>
        <button className="pwa__cta" onClick={() => { setBusy(true); applyUpdate(); }} disabled={busy}>
          {busy ? 'Reloading…' : 'Reload'}
        </button>
      </div>
    );
  }

  if (hidden || isStandalone()) return null;

  const close = (days: number) => { snooze(days); setHidden(true); };

  // iOS has no install API — the only route is the Share sheet, so explain it.
  if (isIos()) {
    return (
      <div className="pwa" role="complementary">
        <Share size={15} className="pwa__ico" />
        <div className="pwa__text">
          <strong>Install LegalCore</strong>
          <span>Tap <Share size={11} /> Share, then <Plus size={11} /> Add to Home Screen. Your saved laws stay readable offline.</span>
        </div>
        <button className="pwa__x" onClick={() => close(30)} aria-label="Dismiss"><X size={14} /></button>
      </div>
    );
  }

  if (!installable) return null;

  const install = async () => {
    setBusy(true);
    const outcome = await promptInstall();
    setBusy(false);
    if (outcome) track(outcome === 'accepted' ? 'pwa_installed' : 'pwa_install_dismissed');
    // Accepted or refused, the card has done its job.
    if (outcome === 'accepted') setHidden(true);
    else if (outcome === 'dismissed') close(14);
  };

  return (
    <div className="pwa" role="complementary">
      <Download size={15} className="pwa__ico" />
      <div className="pwa__text">
        <strong>Install LegalCore</strong>
        <span>Open it like an app and read your saved laws offline. A free account is still needed to search and ask the AI.</span>
      </div>
      <button className="pwa__cta" onClick={() => void install()} disabled={busy}>
        {busy ? 'Installing…' : 'Install'}
      </button>
      <button className="pwa__x" onClick={() => close(14)} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}
