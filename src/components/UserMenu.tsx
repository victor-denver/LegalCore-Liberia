import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, ShieldCheck, Bookmark, Cloud, CloudOff, Sparkles, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { openFeedback } from '../lib/feedbackBus';
import './UserMenu.css';

export default function UserMenu() {
  const { enabled, status, user, profile, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open]);
  const close = () => setOpen(false);

  if (!enabled) return <span className="topbar__avatar" title="Local mode — sign-in not configured">LC</span>;

  if (status !== 'signed-in' || !user) {
    return (
      <button className="usermenu__signin" onClick={() => navigate(`/login?next=${encodeURIComponent(location.pathname)}`)} aria-label="Sign in">
        <LogIn size={14} /> <span>Sign in</span>
      </button>
    );
  }

  const name = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || user.email || 'Account';
  const avatar = profile?.avatar_url || (user.user_metadata?.avatar_url as string | undefined) || (user.user_metadata?.picture as string | undefined);
  const initials = name.split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="usermenu" ref={ref}>
      <button className="topbar__avatar usermenu__btn" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} title={name}>
        {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : initials}
        {isAdmin && <span className="usermenu__admin-dot" aria-label="Admin" />}
      </button>
      {open && (
        <div className="usermenu__panel" role="menu">
          <div className="usermenu__who">
            <strong>{name}</strong>
            <small>{user.email}</small>
            <span className="usermenu__sync"><Cloud size={11} /> Library synced</span>
          </div>
          <Link to="/saved" role="menuitem" onClick={close}><Bookmark size={14} /> Saved & briefs</Link>
          <Link to="/plans" role="menuitem" onClick={close}><Sparkles size={14} /> Plans & roadmap</Link>
          <button role="menuitem" onClick={() => { close(); openFeedback(); }}><MessageSquarePlus size={14} /> Send feedback</button>
          {isAdmin && <Link to="/admin" role="menuitem" className="usermenu__adminlink" onClick={close}><ShieldCheck size={14} /> Admin</Link>}
          <button role="menuitem" onClick={() => { close(); void signOut(); navigate('/'); }}><LogOut size={14} /> Sign out</button>
          <div className="usermenu__foot"><CloudOff size={11} /> Signing out keeps a local copy on this device.</div>
        </div>
      )}
    </div>
  );
}
