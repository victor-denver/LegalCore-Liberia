import { useEffect, useState } from 'react';
import { documents } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import './LoadingScreen.css';

/** Counted from the corpus rather than hard-coded, so it cannot drift out of date. */
const CORPUS_SIZE = documents.length + ecowasCommunityDocs.length;

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setTimeout(onDone, 400); return 100; }
        return Math.min(100, p + Math.random() * 16 + 5);
      });
    }, 130);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div className="loading-screen">
      <div className="loading-flag" />
      <div className="loading-card">
        <img src="/logo/AmaraTech IT Logo (new) - dark bg.png" alt="AmaraTech" className="loading-logo" />
        <h1>LegalCore West Africa</h1>
        <p>Loading law across 12 ECOWAS states — {CORPUS_SIZE} instruments, offline-ready</p>
        <div className="loading-bar">
          <div className="loading-bar__fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="loading-pct">{Math.round(progress)}%</span>
        <div className="loading-dots"><span /><span /><span /></div>
        <span className="loading-sub">Cited sources • Ask the law • Pan-African law 🇱🇷</span>
      </div>
      <div className="loading-flag loading-flag--bottom" />
    </div>
  );
}
