import { Link, useLocation } from 'react-router-dom';
import { Search, Compass, Scale, MapPin, Sparkles } from 'lucide-react';
import './MobileTabBar.css';

const tabs = [
  { to: '/', label: 'ECOWAS', icon: Compass, match: ['/', '/west-africa'] },
  { to: '/search', label: 'Search', icon: Search, match: ['/search'] },
  { to: '/ai', label: 'AI', icon: Sparkles, match: ['/ai'], special: true },
  { to: '/browse', label: 'Browse', icon: Scale, match: ['/browse'] },
  { to: '/map', label: 'Map', icon: MapPin, match: ['/map'] },
];

export default function MobileTabBar(){
  const loc = useLocation();
  return (
    <nav className="tabbar" aria-label="Mobile navigation">
      <div className="tabbar__inner">
        {tabs.map(t=>{
          const Icon = t.icon;
          const active = t.match.some(p=> loc.pathname===p || (p==='/' && loc.pathname==='/west-africa'));
          return (
            <Link key={t.to} to={t.to} className={`tabbar__tab ${active?'tabbar__tab--active':''} ${t.special?'tabbar__tab--special':''}`}>
              <span className="tabbar__icon">
                {t.special
                  ? <img src="/avatar/4231e846-2f39-4ead-8f30-2be6701be53e.png" alt="" className="tabbar__avatar" />
                  : <Icon size={18} />}
              </span>
              <span className="tabbar__label">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
