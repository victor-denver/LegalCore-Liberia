import { useEffect, useState } from 'react';
import './LoadingScreen.css';

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setTimeout(onDone, 300); return 100; }
        return Math.min(100, p + Math.random()*18 + 6);
      });
    }, 120);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div className="loading-screen">
      <div className="loading-flag" />
      <div className="loading-card">
        <img src="/logo/AmaraTech IT Logo (new) - dark bg.png" alt="AmaraTech" className="loading-logo" />
        <h1>LegalCore Liberia</h1>
        <p>Loading Liberia's laws — 1847 to 2026 • 590+ documents • 15 counties</p>
        <div className="loading-bar">
          <div className="loading-bar__fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="loading-pct">{Math.round(progress)}% • Eh my man, small time o!</span>
        <div className="loading-dots"><span/><span/><span/></div>
        <span className="loading-sub">More valuable than ChatGPT — cited, Koloqua voice, offline ready 🇱🇷</span>
      </div>
      <div className="loading-flag loading-flag--bottom" />
    </div>
  );
}
