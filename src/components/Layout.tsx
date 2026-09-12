import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Bookmark, Bell, Maximize2, Sparkles, GitCompare, LogIn, ShieldCheck, Sun, Moon } from 'lucide-react';
import MobileTabBar from './MobileTabBar';
import AiDock from './AiDock';
import UserMenu from './UserMenu';
import FeedbackWidget from './FeedbackWidget';
import LoginNudge from './LoginNudge';
import PwaBanner from './PwaBanner';
import OnboardingModal from './OnboardingModal';
import { useAppConfig } from '../hooks/useAppConfig';
import { useAuth } from '../hooks/useAuth';
import { track } from '../lib/analytics';
import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { documents } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { rankDocuments } from '../utils/smartSearch';
import './Layout.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [q, setQ] = useState('');
  const { isDark, toggle: toggleTheme } = useTheme();
  const { code: jurisCode, active: juris } = useJurisdiction();
  const totalInstruments = documents.length + ecowasCommunityDocs.length;
  const cfg = useAppConfig();
  const { isAdmin } = useAuth();
  const [annClosed, setAnnClosed] = useState(false);

  useEffect(() => { track('page_view'); }, [location.pathname]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdOpen(v=>!v); }
      if (e.key==='Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', h);
    return ()=> window.removeEventListener('keydown', h);
  }, []);
  // Navigating away closes the mobile menu. Adjusting state during render is the
  // documented pattern for this; an effect would cost an extra render pass.
  const [menuPath, setMenuPath] = useState(location.pathname);
  if (location.pathname !== menuPath) {
    setMenuPath(location.pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useEffect(()=> { document.body.style.overflow = cmdOpen||mobileOpen ? 'hidden' : ''; return ()=>{document.body.style.overflow='';}; },[cmdOpen,mobileOpen]);

  const filtered = useMemo(()=>{
    if(!q.trim()) return documents.slice(0,5);
    return rankDocuments(documents, q).slice(0,8);
  },[q]);

  return (
    <div className="layout">
      <div className="ecowas-scream-bar">
        <span>WEST AFRICA</span>
        <span className="ecowas-scream-bar__dot">•</span>
        <span>12 ECOWAS STATES</span>
        <span className="ecowas-scream-bar__dot">•</span>
        <span>3 TRADITIONS</span>
        <span className="ecowas-scream-bar__dot">•</span>
        <span>ONE SEARCHABLE BODY OF LAW</span>
        <span className="ecowas-scream-bar__flags">
          <img src="https://flagcdn.com/w20/lr.png" alt="LR" /><img src="https://flagcdn.com/w20/ng.png" alt="NG" /><img src="https://flagcdn.com/w20/gh.png" alt="GH" /><img src="https://flagcdn.com/w20/sl.png" alt="SL" /><img src="https://flagcdn.com/w20/sn.png" alt="SN" /><img src="https://flagcdn.com/w20/ci.png" alt="CI" />
        </span>
      </div>
      <div className="liberia-flag-bar" aria-label="Liberia Flag" title="Liberia Flag — 11 red and white stripes, blue canton with star" />
      {cfg.announcement?.text && !annClosed && (
        <div className={`announce announce--${cfg.announcement.tone ?? 'gold'}`} role="status">
          {cfg.announcement.href ? <a href={cfg.announcement.href}>{cfg.announcement.text}</a> : <span>{cfg.announcement.text}</span>}
          <button onClick={() => setAnnClosed(true)} aria-label="Dismiss announcement"><X size={13} /></button>
        </div>
      )}
      <nav className="topbar">
        <div className="topbar__inner">
          <div className="topbar__left">
            <Link to="/" className="topbar__logo">
              <img src={isDark ? "/logo/AmaraTech IT Logo (new) - dark bg.png" : "/logo/Login Logo (140x60 px) light mode.png"} alt="AmaraTech — LegalCore West Africa" className="topbar__logo-img" />
              <span className="topbar__brand">
                <span className="topbar__brand-name">LegalCore</span>
                <span className="topbar__brand-sub">WEST AFRICA</span>
              </span>
            </Link>
            <div className="topbar__nav">
              <Link to="/search" className={`topbar__link ${location.pathname==='/search'?'topbar__link--active':''}`}>Search</Link>
              <Link to="/browse" className={`topbar__link ${location.pathname==='/browse'?'topbar__link--active':''}`}>Browse</Link>
              <Link to="/map" className={`topbar__link ${location.pathname==='/map'?'topbar__link--active':''}`}>Courts</Link>
              <Link to="/compare" className={`topbar__link ${location.pathname==='/compare'?'topbar__link--active':''}`}>Compare</Link>
              <Link to="/ai" className={`topbar__link ${location.pathname==='/ai'?'topbar__link--active':''}`}>AI</Link>
              <Link to="/west-africa" className={`topbar__link ${(location.pathname==='/west-africa' || location.pathname==='/')?'topbar__link--active':''}`}>ECOWAS</Link>
              {isAdmin && <Link to="/admin" className={`topbar__link topbar__link--admin ${location.pathname.startsWith('/admin')?'topbar__link--active':''}`}><ShieldCheck size={13}/> Admin</Link>}
            </div>
          </div>

          <button className="topbar__search" onClick={()=>setCmdOpen(true)} aria-label="Search">
            <Search size={14} />
            <span>Search {juris.name} law + ECOWAS…</span>
            <span className="topbar__search-icon"><Maximize2 size={14}/></span>
          </button>

          <div className="topbar__right">
            <button className="topbar__country" onClick={()=>navigate('/west-africa')} title={`Viewing ${juris.name} — tap to change country`} aria-label="Change country">
              <img src={`https://flagcdn.com/w40/${juris.flag}.png`} alt={`${juris.name} flag`} />
              <span>{juris.name}</span>
              <small>{juris.status==='active' ? 'LIVE' : juris.phase}</small>
            </button>
            <button className="topbar__icon" aria-label="Saved library" title="Saved & briefs" onClick={()=>navigate('/saved')}><Bookmark size={16}/></button>
            <button className="topbar__icon" aria-label="Notifications"><Bell size={16}/></button>
            <button
              className="topbar__theme"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
            <UserMenu />
            <button className="topbar__menu" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X size={18}/> : <Menu size={18}/>}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <>
            <div className="mobile-backdrop" onClick={()=>setMobileOpen(false)} />
            <div className="mobile-menu" role="menu">
              <Link to="/search" onClick={()=>setMobileOpen(false)} className={location.pathname==='/search'?'active':''}>Search</Link>
              <Link to="/browse" onClick={()=>setMobileOpen(false)} className={location.pathname==='/browse'?'active':''}>Browse</Link>
              <Link to="/map" onClick={()=>setMobileOpen(false)} className={location.pathname==='/map'?'active':''}>Map</Link>
              <Link to="/compare" onClick={()=>setMobileOpen(false)} className={location.pathname==='/compare'?'active':''}><GitCompare size={14}/> Compare</Link>
              <Link to="/ai" onClick={()=>setMobileOpen(false)} className={location.pathname==='/ai'?'active':''}><Sparkles size={14}/> AI Assistant</Link>
              <Link to="/saved" onClick={()=>setMobileOpen(false)} className={location.pathname==='/saved'?'active':''}><Bookmark size={14}/> Saved & Briefs</Link>
              <Link to="/methodology" onClick={()=>setMobileOpen(false)} className={location.pathname==='/methodology'?'active':''}>Methodology</Link>
              <Link to="/about" onClick={()=>setMobileOpen(false)} className={location.pathname==='/about'?'active':''}>About Us</Link>
              <Link to="/west-africa" onClick={()=>setMobileOpen(false)} className={(location.pathname==='/west-africa'||location.pathname==='/')?'active':''}>ECOWAS Plan</Link>
              <Link to="/plans" onClick={()=>setMobileOpen(false)} className={location.pathname==='/plans'?'active':''}><Sparkles size={14}/> Plans & roadmap</Link>
              {isAdmin && <Link to="/admin" onClick={()=>setMobileOpen(false)} className={`mobile-menu__admin ${location.pathname.startsWith('/admin')?'active':''}`}><ShieldCheck size={14}/> Admin dashboard</Link>}
              <Link to="/login" onClick={()=>setMobileOpen(false)} className={location.pathname==='/login'?'active':''}><LogIn size={14}/> Sign in</Link>
              <button className="mobile-menu__theme" onClick={toggleTheme}>
                {isDark ? <><Sun size={14}/> Light mode</> : <><Moon size={14}/> Dark mode</>}
              </button>
            </div>
          </>
        )}
      </nav>

      {cmdOpen && (
        <div className="cmd-overlay" onClick={()=>setCmdOpen(false)}>
          <div className="cmd-box" onClick={e=>e.stopPropagation()}>
            <div className="cmd-box__header">
              <Search size={16}/>
              <input autoFocus placeholder={`Search ${juris.name} law — misspellings are fine`} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); if(q.trim()){ navigate(`/search?q=${encodeURIComponent(q.trim())}`); setCmdOpen(false);} }}} />
              <span className="cmd-esc">ESC</span>
            </div>
            <div className="cmd-box__list">
              {q.trim() && (
                <button className="cmd-item" onClick={()=>{ navigate(`/search?q=${encodeURIComponent(q.trim())}`); setCmdOpen(false);}}>
                  <span className="cmd-tag cmd-tag--constitution">search</span>
                  <span className="cmd-title">All results for “{q.trim()}”</span>
                </button>
              )}
              {filtered.map(d=>(
                <button key={d.id} className="cmd-item" onClick={()=>{ navigate(`/document/${d.id}`); setCmdOpen(false);}}>
                  <span className={`cmd-tag cmd-tag--${d.type}`}>{d.type}</span>
                  <span className="cmd-title">{d.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="main-content">{children}</main>
      <AiDock />
      <MobileTabBar />
      <FeedbackWidget />
      <LoginNudge />
      <PwaBanner />
      <OnboardingModal />

      <footer className="footer">
        <div className="footer__flag" aria-label="Liberia Flag — 11 stripes red & white, blue canton with star" />
        <div className="footer__inner">
          <div className="footer__links">
            <Link to="/about">About Us</Link>
            <span>•</span>
            <Link to="/west-africa">ECOWAS Plan</Link>
            <span>•</span>
            <Link to="/search">Search</Link>
            <span>•</span>
            <Link to="/compare">Compare</Link>
            <span>•</span>
            <Link to="/methodology">Methodology</Link>
            <span>•</span>
            <Link to="/ai">AI Assistant</Link>
            <span>•</span>
            <Link to="/plans">Plans</Link>
          </div>
          <span>© {new Date().getFullYear()} LegalCore {juris.name} — AmaraTech • {totalInstruments} instruments • 1847–2026 • Viewing {jurisCode}{juris.status==='active' ? '' : ' (queued — ECOWAS + comparative)'}</span>
          <span>For everyone • Type anything → Press Enter</span>
        </div>
      </footer>
    </div>
  );
}
