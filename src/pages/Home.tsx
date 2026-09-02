import { Link } from 'react-router-dom';
import { Search, Sparkles, ArrowRight, SlidersHorizontal } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { categories, stats, courtLocations } from '../data/legalData';
import './Home.css';

export default function Home() {

  const uiElements = [
    'Statute Card', 'Case Card', 'Search Bar', 'Citation Pill', 'Filter Chips'
  ];

  const flows = [
    'Search & Find', 'Ask AI & Verify', 'Browse & Filter', 'Read & Cite', 'Map & Locate'
  ];

  const mocks = [
    { title: 'Land Rights Act 2018', type: 'Statute', color: '#EDE9FE', updated: true },
    { title: 'Constitution 1986', type: 'Constitution', color: '#FFFFFF', updated: true },
    { title: 'Maritime Law 1948', type: 'Statute', color: '#FEF3C7', updated: true },
    { title: 'Penal Law 1956', type: 'Statute', color: '#E0F2FE', updated: false },
    { title: 'TRC Act 2006', type: 'Case', color: '#FCE7F3', updated: true },
    { title: 'Firestone 1926', type: 'Case', color: '#DCFCE7', updated: false },
  ];

  return (
    <div className="home">
      {/* MEGA NAV — exactly like screenshot */}
      <section className="mega">
        <div className="mega__grid">
          <div className="mega__col">
            <span className="mega__heading">Categories</span>
            <div className="mega__list">
              {categories.slice(0,5).map(c=>(
                <Link key={c.id} to={`/search?category=${c.id}`} className="mega__item">{c.label}</Link>
              ))}
              <Link to="/browse" className="mega__item mega__item--muted">View all {categories.length} →</Link>
            </div>
          </div>
          <div className="mega__col">
            <span className="mega__heading">Screens</span>
            <div className="mega__list">
              <Link to="/search" className="mega__item">Search</Link>
              <Link to="/browse" className="mega__item">Browse</Link>
              <Link to="/map" className="mega__item">Court Map</Link>
              <Link to="/ai" className="mega__item">AI Assistant</Link>
              <Link to="/search" className="mega__item">Document</Link>
            </div>
          </div>
          <div className="mega__col">
            <span className="mega__heading">UI Elements</span>
            <div className="mega__list">
              {uiElements.map(t=>(
                <span key={t} className="mega__item">{t}</span>
              ))}
            </div>
          </div>
          <div className="mega__col">
            <span className="mega__heading">Flows</span>
            <div className="mega__list">
              {flows.map(f=>(
                <span key={f} className="mega__item">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FILTER BAR — like screenshot */}
      <div className="filterbar">
        <div className="filterbar__left">
          <div className="segment">
            <button className="segment__btn segment__btn--active">All</button>
            <button className="segment__btn">Liberia</button>
          </div>
          <div className="tabs">
            <button className="tab tab--active">Latest</button>
            <button className="tab">Most popular</button>
            <button className="tab">Top rated</button>
            <button className="tab">Updated</button>
          </div>
        </div>
        <button className="filterbar__filter">
          <SlidersHorizontal size={14}/> Filter
        </button>
      </div>

      {/* HELPER — dumb-proof line, red white blue subtle */}
      <div className="helper">
        <Search size={14}/> <strong>New?</strong> Type any word in the search above — try <em>land rights</em> or <em>Constitution</em>. Or tap a category above. Then ask AI for plain English.
      </div>

      {/* CARDS GRID — like screenshot 3-per-row dark cards */}
      <section className="cards">
        {mocks.map((m, i)=>(
          <Link key={i} to="/search" className="card">
            <span className="card__updated">{m.updated ? 'Updated' : 'New'}</span>
            <div className="card__phone" style={{ background: m.color }}>
              <div className="card__phone-header">
                <span className="card__phone-dot" />
                <span className="card__phone-title">{m.title}</span>
                <span className="card__phone-type">{m.type}</span>
              </div>
              <div className="card__phone-body">
                <div className="card__phone-line" style={{ width: '84%' }} />
                <div className="card__phone-line" style={{ width: '62%' }} />
                <div className="card__phone-line" style={{ width: '74%' }} />
                <div className="card__phone-badge">{stats.totalDocuments}+ docs</div>
              </div>
            </div>
            <div className="card__footer">
              <span className="card__name">{m.title}</span>
              <span className="card__meta">{m.type} • {i===0?2018:i===1?1986:i===2?1948:1956}</span>
            </div>
          </Link>
        ))}

        {/* Real search bar card */}
        <div className="card card--search">
          <span className="card__updated">Try it</span>
          <div className="card__search-wrap">
            <SearchBar placeholder="Search Liberian law — try Land Rights Act..." />
            <div className="card__search-help">
              <Sparkles size={12}/> Ask AI after you search — it cites real docs
            </div>
          </div>
          <div className="card__footer">
            <span className="card__name">Search — {stats.totalDocuments}+ docs</span>
            <span className="card__meta">~18ms • Cited • For everyone</span>
          </div>
        </div>

        <Link to="/ai" className="card card--ai">
          <span className="card__updated">Own AI</span>
          <div className="card__ai">
            <div className="card__ai-icon"><Sparkles size={18}/></div>
            <h3>Ask in plain English</h3>
            <p>“What is customary land?” → Cited answer from real documents. No guessing.</p>
            <span className="card__ai-cta">Try AI <ArrowRight size={12}/></span>
          </div>
          <div className="card__footer">
            <span className="card__name">LegalCore AI</span>
            <span className="card__meta">Grounded • {stats.totalDocuments} docs</span>
          </div>
        </Link>

        <Link to="/map" className="card card--map">
          <span className="card__updated">15 counties</span>
          <div className="card__map">
            <div className="card__map-dots">
              <span className="dot dot--red"/><span className="dot dot--blue"/><span className="dot dot--blue"/><span className="dot dot--red"/>
            </div>
            <h3>Court Map</h3>
            <p>Tap any red or blue dot to see address.</p>
          </div>
          <div className="card__footer">
            <span className="card__name">Court Map</span>
            <span className="card__meta">{courtLocations.length} locations</span>
          </div>
        </Link>
      </section>

      {/* BOTTOM STATS STRIP — neat */}
      <div className="bottom-strip">
        <span><strong>{stats.statutes}</strong> Statutes</span>
        <span className="bottom-dot">•</span>
        <span><strong>{stats.cases}</strong> Cases</span>
        <span className="bottom-dot">•</span>
        <span><strong>{stats.opinions}</strong> Opinions</span>
        <span className="bottom-dot">•</span>
        <span>{stats.yearsSpan} • {stats.totalDocuments}+ docs</span>
      </div>
    </div>
  );
}
