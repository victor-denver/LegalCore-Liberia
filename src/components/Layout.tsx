import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Bookmark, Bell, Maximize2, Sparkles, Sun, Moon, GitCompare } from 'lucide-react';
import MobileTabBar from './MobileTabBar';
import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { documents } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import './Layout.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [q, setQ] = useState('');
  const { toggle, isDark } = useTheme();
  const { code: jurisCode, active: juris } = useJurisdiction();
  const totalInstruments = documents.length + ecowasCommunityDocs.length;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdOpen(v=>!v); }
      if (e.key==='Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', h);
    return ()=> window.removeEventListener('keydown', h);
  }, []);
  useEffect(()=> setMobileOpen(false), [location.pathname]);
  useEffect(()=> { document.body.style.overflow = cmdOpen||mobileOpen ? 'hidden' : ''; return ()=>{document.body.style.overflow='';}; },[cmdOpen,mobileOpen]);

  const filtered = useMemo(()=>{
    if(!q.trim()) return documents.slice(0,5);
    const t=q.toLowerCase();
    return documents.filter(d=> d.title.toLowerCase().includes(t) || d.tags.some(x=>x.toLowerCase().includes(t))).slice(0,5);
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
            <button className="topbar__theme" onClick={toggle} aria-label="Toggle theme" title={isDark ? "Switch to light" : "Switch to dark"}>
              {isDark ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
            <button className="topbar__icon" aria-label="Notifications"><Bell size={16}/></button>
            <span className="topbar__avatar">LC</span>
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
            </div>
          </>
        )}
      </nav>

      {cmdOpen && (
        <div className="cmd-overlay" onClick={()=>setCmdOpen(false)}>
          <div className="cmd-box" onClick={e=>e.stopPropagation()}>
            <div className="cmd-box__header">
              <Search size={16}/>
              <input autoFocus placeholder={`Search ${juris.name} law — try Land Rights Act, OHADA, free movement`} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&filtered[0]){ navigate(`/document/${filtered[0].id}`); setCmdOpen(false);}}} />
              <span className="cmd-esc">ESC</span>
            </div>
            <div className="cmd-box__list">
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
      <MobileTabBar />

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
          </div>
          <span>© {new Date().getFullYear()} LegalCore {juris.name} — AmaraTech • {totalInstruments} instruments • 1847–2026 • Viewing {jurisCode}{juris.status==='active' ? '' : ' (queued — ECOWAS + comparative)'}</span>
          <span>For everyone • Type anything → Press Enter</span>
        </div>
      </footer>
    </div>
  );
}
