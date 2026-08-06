import { Link, useLocation } from 'react-router-dom';
import { Scale, Search, BookOpen, Menu, X, Sun, Moon, MapPin, MessageSquare, Construction } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggle, isDark } = useTheme();
  const isHome = location.pathname === '/';
  const logoSrc = isDark
    ? '/logo/AmaraTech IT Logo (new) - dark bg.png'
    : '/logo/Login Logo (140x60 px) light mode.png';
  const logoAlt = isDark ? 'Dark theme logo' : 'Light theme logo';

  return (
    <div className={`layout theme-${theme}`}>
      <nav className={`navbar ${isHome ? 'navbar--transparent' : 'navbar--solid'}`}>
        <div className="navbar__inner">
          <Link to="/" className="navbar__logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="navbar__logo-icon">
              <img src={logoSrc} alt={logoAlt} className="navbar__logo-img" />
            </div>
            <span className="navbar__logo-text">
              Legal<span className="navbar__logo-accent">Core</span>
            </span>
          </Link>

          <div className={`navbar__links ${mobileMenuOpen ? 'navbar__links--open' : ''}`}>
            <Link to="/search" className={`navbar__link ${location.pathname === '/search' ? 'navbar__link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
              <Search size={16} /> Search
            </Link>
            <Link to="/browse" className={`navbar__link ${location.pathname === '/browse' ? 'navbar__link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
              <BookOpen size={16} /> Browse
            </Link>
            <Link to="/map" className={`navbar__link ${location.pathname === '/map' ? 'navbar__link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
              <MapPin size={16} /> Map
            </Link>
            <Link to="/ai" className={`navbar__link ${location.pathname === '/ai' ? 'navbar__link--active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
              <MessageSquare size={16} /> AI Assistant
            </Link>
          </div>

          <div className="navbar__actions">
            <button className="navbar__theme-toggle" onClick={toggle} aria-label="Toggle theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="navbar__mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__top">
            <div className="footer__brand-col">
              <div className="footer__brand">
                <div className="footer__brand-icon">
                  <img src={logoSrc} alt={logoAlt} className="footer__brand-img" />
                </div>
                <div>
                  <span className="footer__brand-name">LegalCore Liberia</span>
                  <span className="footer__brand-tagline">Empowering legal professionals across Liberia</span>
                </div>
              </div>
            </div>
            <div className="footer__links-col">
              <h4>Platform</h4>
              <Link to="/search">Search</Link>
              <Link to="/browse">Browse</Link>
              <Link to="/map">Court Map</Link>
              <Link to="/ai">AI Assistant</Link>
            </div>
            <div className="footer__links-col">
              <h4>Legal Areas</h4>
              <Link to="/search?category=constitutional">Constitutional</Link>
              <Link to="/search?category=criminal">Criminal</Link>
              <Link to="/search?category=property">Property & Land</Link>
              <Link to="/search?category=commercial">Commercial</Link>
            </div>
          </div>
          <div className="footer__bottom">
            <span className="footer__copy">&copy; {new Date().getFullYear()} LegalCore — All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
