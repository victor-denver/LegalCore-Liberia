import { Link } from 'react-router-dom';
import { Scale, ShieldCheck, Globe, Users, BookOpen, Gavel, Sparkles, ArrowRight, MapPin, Clock3 } from 'lucide-react';
import { stats, courtLocations } from '../data/legalData';
import './AboutPage.css';

export default function AboutPage(){
  return (
    <div className="about">
      <div className="liberia-flag-bar" />
      <section className="about-hero">
        <div className="about-hero__inner">
          <figure className="about-hero__media">
            <img src="/about/about-library.png" alt="" loading="eager" />
          </figure>

          <div className="about-hero__copy">
            <img src="/logo/AmaraTech IT Logo (new) - dark bg.png" alt="AmaraTech IT Solutions" className="about-hero__logo" />
            <span className="about-hero__badge"><Scale size={12}/> About LegalCore West Africa • AmaraTech IT Solutions</span>
            <h1>Primary law, <span>properly cited.</span></h1>
            <p>
              LegalCore is a cited library of West African law — beginning with Liberia, from the
              1847 Constitution to today's statutes, alongside the ECOWAS community instruments that
              bind all twelve member states. Built for students, traders, counsel and chiefs alike:
              if you can tap, you can use it.
            </p>
            <div className="about-hero__stats">
              <span><strong>{stats.totalDocuments}</strong> Liberian instruments</span>
              <span><strong>1847—2026</strong> covered</span>
              <span><strong>12</strong> ECOWAS states</span>
              <span><strong>{courtLocations.length}</strong> courts mapped</span>
            </div>
            <div className="about-hero__actions">
              <Link to="/search" className="about-btn about-btn--red">Search the law <ArrowRight size={14}/></Link>
              <Link to="/ai" className="about-btn about-btn--light"><Sparkles size={14}/> Ask the law</Link>
            </div>
            <p className="about-hero__note">
              Reading and browsing are open to everyone. Searching and the AI need a free account.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-container">
          <div className="about-grid">
            <div className="about-card">
              <h3><ShieldCheck size={18}/> Mission</h3>
              <p>Make West African law <strong>findable, understandable and trustworthy</strong> for everyone. Every document carries its source, its date and the authority that gives it force — so you can check us, not just trust us.</p>
            </div>
            <div className="about-card">
              <h3><Users size={18}/> For everyone</h3>
              <p>A trader in Duala, a student at UL, counsel in Sanniquellie — the same search, the same cited answer. If you can type “land”, you can use it. No legal training assumed, and no jargon you didn't ask for.</p>
            </div>
            <div className="about-card">
              <h3><Globe size={18}/> Built by AmaraTech</h3>
              <p>AmaraTech IT Solutions — a Liberian team building practical technology for West Africa. LegalCore is our flagship: offline-capable, mobile-first, and written in the register people actually read.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-container">
          <h2 className="about-title">What you can do</h2>
          <div className="about-features">
            <Link to="/search" className="about-feature"><SearchIcon/><h4>Instant search</h4><p>Type any word — get laws in ~18ms, even with typos.</p></Link>
            <Link to="/ai" className="about-feature"><Sparkles size={20}/><h4>Cited AI</h4><p>Ask in plain English. Every answer links to the full text.</p></Link>
            <Link to="/browse" className="about-feature"><BookOpen size={20}/><h4>Browse by topic</h4><p>12 categories, from constitution to maritime.</p></Link>
            <Link to="/map" className="about-feature"><MapPin size={20}/><h4>Court map</h4><p>Every Liberian court across 15 counties — tap for directions.</p></Link>
            <div className="about-feature"><Gavel size={20}/><h4>Traceable sources</h4><p>Every document dated and cited, and graded Certified, Verified or Reference so you know how far to trust it.</p></div>
            <div className="about-feature"><Clock3 size={20}/><h4>Fast on phone</h4><p>Lightweight enough for Duala or Harper — and installable, so saved law reads offline.</p></div>
          </div>
        </div>
      </section>

      <section className="about-section about-section--flag">
        <div className="about-container about-flag">
          <img src="/liberiaFlag.png" alt="Flag of Liberia" />
          <div>
            <h3>What is live today</h3>
            <p>
              Liberia is complete and searchable: {stats.totalDocuments} instruments spanning 1847 to 2026.
              For the other eleven ECOWAS states you get community law — the Revised Treaty, protocols
              and supplementary acts that bind all members — plus comparative reference while each
              national corpus clears legal review. We would rather tell you what is missing than
              imply coverage we do not have.
            </p>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-container">
          <h2>Ready to use it?</h2>
          <p>Free, with no card and no fee. Create an account to search and to ask the AI — reading the law never requires one.</p>
          <div className="about-cta__actions">
            <Link to="/login?next=%2Fsearch&mode=signup" className="about-btn about-btn--red">Create a free account</Link>
            <Link to="/browse" className="about-btn about-btn--dark">Browse the library</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SearchIcon(){ return <span style={{display:'grid',placeItems:'center',width:40,height:40,background:'#0E0E0E',color:'white',borderRadius:10}}><Scale size={20}/></span>; }
