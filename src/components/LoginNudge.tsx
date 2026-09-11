import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Cloud } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppConfig } from '../hooks/useAppConfig';
import { viewCount, onViewCount, nudgeDismissed, dismissNudge } from '../lib/nudge';
import { track } from '../lib/analytics';
import './LoginNudge.css';

/**
 * Soft invitation to sign in after N document views. Never blocks content.
 * N comes from app_config.nudge_after_views so it can be tuned without a deploy.
 */
export default function LoginNudge() {
  const { enabled, status } = useAuth();
  const cfg = useAppConfig();
  const location = useLocation();
  const [hidden, setHidden] = useState(false);
  const [views, setViews] = useState(viewCount);
  const tracked = useRef(false);

  useEffect(() => onViewCount(setViews), []);

  const eligible =
    enabled && status === 'signed-out' && !hidden && !nudgeDismissed() &&
    views >= cfg.nudge_after_views &&
    location.pathname.startsWith('/document/');

  useEffect(() => {
    if (eligible && !tracked.current) { tracked.current = true; track('nudge_shown'); }
  }, [eligible]);

  if (!eligible) return null;

  const close = () => { dismissNudge(); setHidden(true); };

  return (
    <div className="nudge animate-in" role="status">
      <Cloud size={16} className="nudge__ico" />
      <div className="nudge__text">
        <strong>Keep what you've found.</strong>
        <span>A free account syncs your saved laws and briefs to every device. Reading stays free either way.</span>
      </div>
      <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="nudge__cta" onClick={() => { track('nudge_clicked'); dismissNudge(); }}>Create a free account</Link>
      <button className="nudge__x" onClick={close} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}
