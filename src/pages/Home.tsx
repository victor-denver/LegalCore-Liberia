import { Link } from 'react-router-dom';
import { Scale, ArrowRight, BookOpen, Gavel, FileText, ScrollText, Zap, Globe, Shield, MapPin, MessageSquare, Flag } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { categories, stats, recentSearches } from '../data/legalData';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__gradient" />
          <div className="hero__grid" />
        </div>

        <div className="hero__content">
          <div className="hero__badge animate-in">
            <Flag size={14} />
            Liberia's Legal Intelligence Platform
          </div>

          <h1 className="hero__title animate-in-up">
            Find the law.<br />
            <span className="hero__title-accent">Instantly.</span>
          </h1>

          <p className="hero__subtitle animate-in-up" style={{ animationDelay: '0.1s' }}>
            Search {stats.yearsSpan} of Liberian statutes, court decisions, and legal opinions
            in seconds — not days. Built for lawyers who move fast.
          </p>

          <div className="hero__search animate-in-up" style={{ animationDelay: '0.2s' }}>
            <SearchBar size="hero" placeholder="Search Liberian law — try 'land rights' or 'Constitution 1847'" />
          </div>

          <div className="hero__recent animate-in-up" style={{ animationDelay: '0.3s' }}>
            <span className="hero__recent-label">Popular:</span>
            {recentSearches.slice(0, 4).map((term) => (
              <Link key={term} to={`/search?q=${encodeURIComponent(term)}`} className="hero__recent-tag">
                {term}
              </Link>
            ))}
          </div>
        </div>

        {/* Liberian flag stripe at bottom of hero */}
        <div className="hero__flag-bar">
          <div className="hero__flag-stripe hero__flag-stripe--red" />
          <div className="hero__flag-stripe hero__flag-stripe--white" />
          <div className="hero__flag-stripe hero__flag-stripe--blue" />
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-section__inner">
          <div className="stat-card">
            <ScrollText size={24} className="stat-card__icon" />
            <span className="stat-card__number">{stats.statutes}</span>
            <span className="stat-card__label">Statutes</span>
          </div>
          <div className="stat-card">
            <Gavel size={24} className="stat-card__icon" />
            <span className="stat-card__number">{stats.cases}</span>
            <span className="stat-card__label">Court Cases</span>
          </div>
          <div className="stat-card">
            <FileText size={24} className="stat-card__icon" />
            <span className="stat-card__number">{stats.opinions}</span>
            <span className="stat-card__label">Opinions</span>
          </div>
          <div className="stat-card">
            <BookOpen size={24} className="stat-card__icon" />
            <span className="stat-card__number">{stats.categories}</span>
            <span className="stat-card__label">Categories</span>
          </div>
        </div>
        <p className="stats-section__span">Covering <strong>{stats.yearsSpan}</strong> of Liberian legal history</p>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="categories-section__inner">
          <div className="section-header">
            <h2 className="section-header__title">Browse by Category</h2>
            <p className="section-header__sub">Explore {stats.totalDocuments}+ documents across {stats.categories} legal domains</p>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/search?category=${cat.id}`} className="category-card">
                <div className="category-card__top">
                  <h3 className="category-card__title">{cat.label}</h3>
                  <span className="category-card__count">{cat.count}</span>
                </div>
                <p className="category-card__desc">{cat.description}</p>
                <div className="category-card__arrow"><ArrowRight size={16} /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="why-section">
        <div className="why-section__inner">
          <div className="section-header">
            <h2 className="section-header__title">Why LegalCore</h2>
            <p className="section-header__sub">Legal research shouldn't take days</p>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-card__icon"><Zap size={24} /></div>
              <h3>Instant Search</h3>
              <p>Find relevant statutes, cases, and opinions in seconds. No more flipping through physical books.</p>
            </div>
            <div className="why-card">
              <div className="why-card__icon"><Globe size={24} /></div>
              <h3>Access Anywhere</h3>
              <p>Works on any device. Optimized for mobile so you can research from the courtroom.</p>
            </div>
            <div className="why-card">
              <div className="why-card__icon"><Shield size={24} /></div>
              <h3>Reliable Sources</h3>
              <p>Every document is sourced and cited. Built with legal accuracy as the top priority.</p>
            </div>
            <div className="why-card">
              <div className="why-card__icon"><MessageSquare size={24} /></div>
              <h3>AI Assistant</h3>
              <p>Ask questions in plain language. Our AI helps you understand complex legal provisions.</p>
            </div>
            <div className="why-card">
              <div className="why-card__icon"><MapPin size={24} /></div>
              <h3>Court Locations</h3>
              <p>Interactive map showing every court and legal institution across Liberia's 15 counties.</p>
            </div>
            <div className="why-card">
              <div className="why-card__icon"><FileText size={24} /></div>
              <h3>PDF Viewer</h3>
              <p>Read full legal documents in a clean, formatted viewer with copy and citation tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-section__inner">
          <div className="cta-card">
            <Scale size={32} className="cta-card__icon" />
            <h2 className="cta-card__title">Ready to research?</h2>
            <p className="cta-card__text">
              Start searching {stats.yearsSpan} of Liberian law. It's fast, it's free, and it's built for you.
            </p>
            <div className="cta-card__buttons">
              <Link to="/search" className="cta-card__button cta-card__button--primary">
                Start Searching <ArrowRight size={18} />
              </Link>
              <Link to="/ai" className="cta-card__button cta-card__button--secondary">
                Try AI Assistant <MessageSquare size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
