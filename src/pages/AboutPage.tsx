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
          <img src="/logo/AmaraTech IT Logo (new) - dark bg.png" alt="AmaraTech" className="about-hero__logo" />
          <span className="about-hero__badge"><Scale size={12}/> About LegalCore Liberia • AmaraTech IT Solutions</span>
          <h1>Law for <span>every Liberian.</span></h1>
          <p>LegalCore is the first <strong>complete, cited, and Koloqua-voiced</strong> library of Liberian law — from the 1847 Constitution to today's statutes. Built for students, market sellers, lawyers and chiefs — if you can tap, you can use it.</p>
          <div className="about-hero__stats">
            <span><strong>{stats.totalDocuments}</strong> laws</span>
            <span><strong>1847—2026</strong></span>
            <span><strong>15</strong> counties</span>
            <span><strong>{courtLocations.length}</strong> courts</span>
          </div>
          <div className="about-hero__actions">
            <Link to="/search" className="about-btn about-btn--red">Search laws <ArrowRight size={14}/></Link>
            <Link to="/ai" className="about-btn about-btn--light"><Sparkles size={14}/> Ask in Koloqua</Link>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-container">
          <div className="about-grid">
            <div className="about-card">
              <h3><ShieldCheck size={18}/> Mission</h3>
              <p>Make Liberian law <strong>findable, understandable and trustworthy</strong> for everyone. No paywall, no guessing, no French flag — only Liberia's flag 🇱🇷, 11 stripes and star.</p>
            </div>
            <div className="about-card">
              <h3><Users size={18}/> For everyone</h3>
              <p>Market woman in Duala, student at UL, counsel in Sanniquellie — all tap the same search, get same cited answer. If you can type “land”, you can use it. We made it <strong>dumb-proof</strong>.</p>
            </div>
            <div className="about-card">
              <h3><Globe size={18}/> Built by AmaraTech</h3>
              <p>AmaraTech IT Solutions — Liberian team building practical tech for Liberia. LegalCore is our flagship: offline-capable, mobile-first, Liberia-voiced.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-container">
          <h2 className="about-title">What you can do</h2>
          <div className="about-features">
            <Link to="/search" className="about-feature"><SearchIcon/><h4>Instant search</h4><p>Type any word — get laws in ~18ms, even with typos.</p></Link>
            <Link to="/ai" className="about-feature"><Sparkles size={20}/><h4>Koloqua AI</h4><p>Ask in plain English or Koloqua, hear Liberia voice.</p></Link>
            <Link to="/browse" className="about-feature"><BookOpen size={20}/><h4>Browse by topic</h4><p>12 categories, from constitution to maritime.</p></Link>
            <Link to="/map" className="about-feature"><MapPin size={20}/><h4>Court map</h4><p>Every court in 15 counties — tap for directions.</p></Link>
            <div className="about-feature"><Gavel size={20}/><h4>Verified sources</h4><p>1847–2026, each doc dated, cited, verified.</p></div>
            <div className="about-feature"><Clock3 size={20}/><h4>Fast on phone</h4><p>52kB, works in Duala or Harper, no app.</p></div>
          </div>
        </div>
      </section>

      <section className="about-section about-section--flag">
        <div className="about-container about-flag">
          <img src="/liberiaFlag.png" alt="Liberia Flag" />
          <div>
            <h3>Liberia Flag — not French</h3>
            <p>11 red & white stripes for the 11 signers of independence, blue canton with white star for the Lone Star. We use it everywhere with pride 🇱🇷. French flag is vertical blue-white-red — not ours.</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-container">
          <h2 className="about-title">Documentation</h2>
          <p style={{textAlign:'center', color:'var(--text-secondary)', marginBottom:16}}>Clear documentation on what we hold and how we capture it — cited, verified, and updated.</p>
          <div style={{display:'flex', justifyContent:'center'}}>
            <a href="/LegalCore_Liberia_Documentation.pdf" download className="about-btn about-btn--red" style={{textDecoration:'none'}}>Download PDF Documentation</a>
          </div>
          <p style={{textAlign:'center', fontSize:12, color:'var(--text-muted)', marginTop:10}}>12 pages — Cover, TOC, Executive Summary, Information Inventory, Data Capture (Sources → Collection → Processing → Storage → Updates), Verification, AI, Design, Tech Stack, Legal, Roadmap, Appendices.</p>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-container">
          <h2>Ready to use it?</h2>
          <p>No sign-up. No fee. Just tap and go — like Facebook, but for law.</p>
          <div className="about-cta__actions">
            <Link to="/search" className="about-btn about-btn--red">Start searching</Link>
            <Link to="/ai" className="about-btn about-btn--dark">Try Koloqua voice</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SearchIcon(){ return <span style={{display:'grid',placeItems:'center',width:40,height:40,background:'#0E0E0E',color:'white',borderRadius:10}}><Scale size={20}/></span>; }
