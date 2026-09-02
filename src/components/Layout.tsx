import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Bookmark, Globe, Bell, Maximize2, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { documents, stats } from '../data/legalData';
import './Layout.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [q, setQ] = useState('');
  const { toggle, isDark } = useTheme();

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
      <div className="liberia-flag-bar" aria-label="Liberia Flag" title="Liberia Flag — 11 red and white stripes, blue canton with star" />
      <nav className="topbar">
        <div className="topbar__left">
          <Link to="/" className="topbar__logo">
            <img src={isDark ? "/logo/AmaraTech IT Logo (new) - dark bg.png" : "/logo/Login Logo (140x60 px) light mode.png"} alt="AmaraTech — LegalCore Liberia" className="topbar__logo-img" />
          </Link>
          <div className="topbar__nav">
            <Link to="/search" className={`topbar__link ${location.pathname==='/search'?'topbar__link--active':''}`}>Search</Link>
            <Link to="/browse" className={`topbar__link ${location.pathname==='/browse'?'topbar__link--active':''}`}>Browse</Link>
            <Link to="/map" className={`topbar__link ${location.pathname==='/map'?'topbar__link--active':''}`}>Courts</Link>
            <Link to="/ai" className={`topbar__link ${location.pathname==='/ai'?'topbar__link--active':''}`}>AI</Link>
          </div>
        </div>

        <button className="topbar__search" onClick={()=>setCmdOpen(true)} aria-label="Search">
          <Search size={14} />
          <span>Search on LegalCore...</span>
          <span className="topbar__search-icon"><Maximize2 size={14}/></span>
        </button>

        <div className="topbar__right">
          <button className="topbar__icon" aria-label="Saved"><Bookmark size={16}/></button>
          <button className="topbar__icon" onClick={toggle} aria-label="Toggle"><Globe size={16}/></button>
          <button className="topbar__icon" aria-label="Notifications"><Bell size={16}/></button>
          <span className="topbar__avatar">LC</span>
          <button className="topbar__menu" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-menu">
          <Link to="/search">Search</Link>
          <Link to="/browse">Browse</Link>
          <Link to="/map">Map</Link>
          <Link to="/ai"><Sparkles size={14}/> AI Assistant</Link>
          <Link to="/about">About Us</Link>
        </div>
      )}

      {cmdOpen && (
        <div className="cmd-overlay" onClick={()=>setCmdOpen(false)}>
          <div className="cmd-box" onClick={e=>e.stopPropagation()}>
            <div className="cmd-box__header">
              <Search size={16}/>
              <input autoFocus placeholder="Search Liberian law — try Land Rights Act, Constitution" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&filtered[0]){ navigate(`/document/${filtered[0].id}`); setCmdOpen(false);}}} />
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

      <footer className="footer">
        <div className="footer__flag" aria-label="Liberia Flag — 11 stripes red & white, blue canton with star" />
        <div className="footer__inner">
          <div className="footer__links">
            <Link to="/about">About Us</Link>
            <span>•</span>
            <Link to="/search">Search</Link>
            <span>•</span>
            <Link to="/ai">Koloqua AI</Link>
          </div>
          <span>© {new Date().getFullYear()} LegalCore Liberia — AmaraTech • {stats.totalDocuments} laws • 1847–2026 • 15 counties • Liberia Flag 🇱🇷</span>
          <span>For everyone • Type anything → Press Enter</span>
        </div>
      </footer>
    </div>
  );
}
