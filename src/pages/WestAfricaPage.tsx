import { Link, useNavigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { documents, courtLocations } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { tierCounts } from '../data/provenance';
import './WestAfricaPage.css';

// Heavy MapLibre GL chunk loads only when this page renders.
const EcowasMap = lazy(() => import('../components/EcowasMap'));

const TOTAL_DOCS = documents.length + ecowasCommunityDocs.length;
const TIERS = tierCounts([...documents, ...ecowasCommunityDocs]);

export default function WestAfricaPage(){
  const navigate = useNavigate();
  const { code: activeCode, setCode } = useJurisdiction();

  const chooseCountry = (code: string, status: string) => {
    setCode(code.toUpperCase());
    // Liberia library → search; every other area → AI re-trained on that country.
    navigate(status === 'active' ? '/search' : '/ai');
  };
  return (
    <div className="wa">
      <div className="liberia-flag-bar" />
      {/* Hero - dark like cover slide */}
      <section className="wa-hero wa-hero--scream">
        <div className="wa-hero__bg-text">WEST AFRICA</div>
        <div className="wa-hero__inner">
          <span className="wa-hero__eyebrow">LegalCore West Africa • ECOWAS Implementation Plan • September 2026 • Liberia LIVE</span>
          <h1>LEGALCORE<br/><span>WEST AFRICA</span></h1>
          <div className="wa-hero__rule" />
          <p>One region. One searchable body of law.<br/><span>Scaling LegalCore Liberia to 12 ECOWAS member states — 590+ Liberia laws already live.</span></p>
          <div className="wa-hero__flags">
            <img src="https://flagcdn.com/w40/lr.png" alt="LR" /><img src="https://flagcdn.com/w40/ng.png" alt="NG" /><img src="https://flagcdn.com/w40/gh.png" alt="GH" /><img src="https://flagcdn.com/w40/sl.png" alt="SL" /><img src="https://flagcdn.com/w40/gm.png" alt="GM" /><img src="https://flagcdn.com/w40/sn.png" alt="SN" /><img src="https://flagcdn.com/w40/ci.png" alt="CI" /><img src="https://flagcdn.com/w40/bj.png" alt="BJ" /><img src="https://flagcdn.com/w40/tg.png" alt="TG" /><img src="https://flagcdn.com/w40/gn.png" alt="GN" /><img src="https://flagcdn.com/w40/cv.png" alt="CV" /><img src="https://flagcdn.com/w40/gw.png" alt="GW" />
          </div>
          <div className="wa-hero__meta">12 STATES • 3 LEGAL TRADITIONS • 3 LANGUAGES • {TOTAL_DOCS} INSTRUMENTS LIVE • ECOWAS</div>
        </div>
      </section>

      {/* Executive Summary */}
      <section className="wa-section">
        <div className="wa-container">
          <h2 className="wa-title">1. Executive Summary</h2>
          <p className="wa-lead">LegalCore Liberia has proven the thesis in a single jurisdiction: lawyers, judges, students and businesses need fast, searchable and reliable access to primary law. That problem is far larger across West Africa, where most national law exists only in paper gazettes, out-of-print codes, or scattered PDFs — with no consolidation, version history or citator.</p>
          <div className="wa-callout">
            This plan proposes <strong>LegalCore West Africa</strong>: a single, multilingual, multi-jurisdiction platform covering legislation, case law and community instruments of the ECOWAS region. <strong>Liberia is live today with {TOTAL_DOCS} instruments (1847–2026)</strong> — Anglophone states go next, then Francophone, then Lusophone + Community law, each the day its corpus clears legal review.
          </div>
          <div className="wa-grid3">
            <div className="wa-card"><span className="wa-card__num">1</span><h4>Sequence by legal tradition, not geography</h4><p>Anglophone common-law first — citation conventions match Liberia. Francophone civil law is a re-architecture, not translation.</p></div>
            <div className="wa-card"><span className="wa-card__num">2</span><h4>Treat legal clearance as a gate</h4><p>Whether law can be republished varies by country. No country enters the queue before clearance is documented.</p></div>
            <div className="wa-card"><span className="wa-card__num">3</span><h4>Build for authority, not volume</h4><p>One verified statute is worth a hundred scraped docs. Trust, once lost, is not recoverable.</p></div>
          </div>
        </div>
      </section>

      {/* Jurisdictional Map */}
      <section className="wa-section wa-section--dark">
        <div className="wa-container">
          <h2 className="wa-title wa-title--white">2. Scope: The Jurisdictional Map</h2>
          <p className="wa-muted">ECOWAS currently comprises 12 member states. Burkina Faso, Mali and Niger withdrew effective 29 Jan 2025 — treated separately.</p>
          <div className="wa-table">
            <div className="wa-table__head"><span>Cluster</span><span>Member states</span><span>Legal tradition</span><span>Language</span></div>
            <div className="wa-table__row"><span>Anglophone common law</span><span>Liberia, Nigeria, Ghana, Sierra Leone, The Gambia</span><span>Common law (Liberia US-influenced; others English)</span><span>English</span></div>
            <div className="wa-table__row"><span>Francophone civil law</span><span>Senegal, Cote d’Ivoire, Benin, Togo, Guinea</span><span>Civil law, French-derived</span><span>French</span></div>
            <div className="wa-table__row"><span>Lusophone civil law</span><span>Cabo Verde, Guinea-Bissau</span><span>Civil law, Portuguese-derived</span><span>Portuguese</span></div>
            <div className="wa-table__row"><span>Community layer</span><span>ECOWAS institutions</span><span>Treaty law</span><span>EN / FR / PT</span></div>
          </div>
          <div className="wa-mini-grid">
            <div className="wa-mini"><span>1</span><h4>ECOWAS Community law</h4><p>Revised Treaty, Protocols, Regulations, Directives + Community Court jurisprudence.</p></div>
            <div className="wa-mini"><span>2</span><h4>OHADA Uniform Acts</h4><p>Directly applicable business law in 6 states + CCJA case law. Highest commercial value.</p></div>
            <div className="wa-mini"><span>3</span><h4>Customary & religious law</h4><p>Recognised in nearly every state — carried as secondary, never primary.</p></div>
            <div className="wa-mini"><span>4</span><h4>Sub-national law</h4><p>Nigeria’s 36 states + FCT — 37 jurisdictions, budgeted as such.</p></div>
          </div>
          <div className="wa-note">Sahel track (optional, Phase 4): Burkina Faso, Mali, Niger remain OHADA members — covered as “West Africa Extended” kept editorially separate from ECOWAS.</div>
        </div>
      </section>

      {/* ECOWAS Countries — Chooser with flags */}
      <section className="wa-section">
        <div className="wa-container">
          <h2 className="wa-title">Choose your ECOWAS country — the whole app follows</h2>
          <p className="wa-muted">Tap a flag to make it your area: search, AI language, voice and training all switch. Liberia is fully live; other areas run on ECOWAS community law + comparative reference until their corpus lands.</p>
          <div className="wa-countries">
            {[
              { code:'lr', name:'Liberia', capital:'Monrovia', lang:'English', tradition:'Common law', status:'active', docs:'590+' },
              { code:'sl', name:'Sierra Leone', capital:'Freetown', lang:'English', tradition:'Common law', status:'next' },
              { code:'gh', name:'Ghana', capital:'Accra', lang:'English', tradition:'Common law', status:'queued' },
              { code:'gm', name:'The Gambia', capital:'Banjul', lang:'English', tradition:'Common law', status:'queued' },
              { code:'ng', name:'Nigeria', capital:'Abuja', lang:'English', tradition:'Common law (37 jurisdictions)', status:'queued' },
              { code:'sn', name:'Senegal', capital:'Dakar', lang:'French', tradition:'Civil law', status:'queued' },
              { code:'ci', name:"Cote d'Ivoire", capital:'Yamoussoukro', lang:'French', tradition:'Civil law', status:'queued' },
              { code:'bj', name:'Benin', capital:'Porto-Novo', lang:'French', tradition:'Civil law', status:'queued' },
              { code:'tg', name:'Togo', capital:'Lome', lang:'French', tradition:'Civil law', status:'queued' },
              { code:'gn', name:'Guinea', capital:'Conakry', lang:'French', tradition:'Civil law', status:'queued' },
              { code:'cv', name:'Cabo Verde', capital:'Praia', lang:'Portuguese', tradition:'Civil law', status:'queued' },
              { code:'gw', name:'Guinea-Bissau', capital:'Bissau', lang:'Portuguese', tradition:'Civil law', status:'queued' },
            ].map(c=> (
              <div key={c.code} className={`wa-country ${c.status==='active'?'wa-country--active':''} ${activeCode===c.code.toUpperCase()?'wa-country--viewing':''}`}>
                <img src={`https://flagcdn.com/w80/${c.code}.png`} srcSet={`https://flagcdn.com/w160/${c.code}.png 2x`} alt={`${c.name} flag`} className="wa-country__flag" loading="lazy" />
                <div className="wa-country__head">
                  <strong>{c.name}</strong>
                  <span className={`wa-country__badge wa-country__badge--${c.status}`}>{activeCode===c.code.toUpperCase() ? '👁 Viewing' : c.status==='active'?'LIVE • Active': c.status==='next' ? 'Next — Phase 1' : 'Queued'}</span>
                </div>
                <div className="wa-country__meta">{c.capital} • {c.lang} • {c.tradition}</div>
                {c.status==='active' ? (
                  <button className="wa-country__btn wa-country__btn--active" onClick={()=>chooseCountry(c.code, c.status)}>Enter {c.name} → <span>{c.docs} laws</span></button>
                ) : (
                  <button className="wa-country__btn" onClick={()=>chooseCountry(c.code, c.status)}>Activate {c.name} — AI + search follow</button>
                )}
              </div>
            ))}
          </div>
          <p className="wa-footnote">Liberia is live with 590+ documents (1847–2026). Other areas unlock by legal tradition — Anglophone first, then Francophone, then Lusophone — after legal clearance. Tapping a flag re-trains the AI on that area instantly.</p>
        </div>
      </section>

      {/* Guiding Principles */}
      <section className="wa-section">
        <div className="wa-container">
          <h2 className="wa-title">3. Guiding Principles</h2>
          <ul className="wa-list">
            <li><strong>Authority over volume.</strong> Every law shows its source and certificate — no mystery text.</li>
            <li><strong>Point-in-time law.</strong> What the law said, as of its date.</li>
            <li><strong>Open standards.</strong> Built so law stays portable, multilingual and citable — never locked in.</li>
            <li><strong>Free to read, permanently.</strong> The law itself is never paywalled.</li>
            <li><strong>No unsourced AI.</strong> Grounded, cited, refuses on low confidence, non-advice disclaimer.</li>
            <li><strong>Reviewed with lawyers.</strong> Each area&apos;s corpus is checked against official sources before it goes live.</li>
          </ul>
        </div>
      </section>

      {/* Roadmap */}
      <section className="wa-section wa-section--light">
        <div className="wa-container">
          <h2 className="wa-title">4. Phased Roadmap — Liberia live, region next</h2>
          <p className="wa-muted" style={{marginBottom:16}}>No area goes live before its corpus clears legal review. Status is shown honestly below.</p>
          <div className="wa-roadmap">
            <div className="wa-phase wa-phase--dark"><span>PHASE 0</span><h4>Foundations</h4><p>✅ Live now</p><p>Liberia on the multi-jurisdiction model: full library, per-country AI, certificates on every law, court map.</p><em>Live: {TOTAL_DOCS} instruments, 1847–2026, free with no login</em></div>
            <div className="wa-phase"><span>PHASE 1</span><h4>Anglophone</h4><p>Next</p><p>Sierra Leone, Ghana, The Gambia, Nigeria — federal first, then states.</p><em>Goes live corpus by corpus as each clears review</em></div>
            <div className="wa-phase"><span>PHASE 2</span><h4>Francophone</h4><p>Queued</p><p>Senegal, Cote d’Ivoire, Benin, Togo, Guinea + OHADA module.</p><em>OHADA guides already live in the Community layer</em></div>
            <div className="wa-phase"><span>PHASE 3</span><h4>Lusophone</h4><p>Queued</p><p>Cabo Verde, Guinea-Bissau + ECOWAS Community law & Court.</p><em>Free-movement + Court protocol already live</em></div>
          </div>
          <p className="wa-footnote">Later: deeper history, analytics, practice tools. Why this order: it follows legal traditions, so citations and procedures carry over instead of starting from zero.</p>
        </div>
      </section>

      {/* Who it's for */}
      <section className="wa-section">
        <div className="wa-container">
          <h2 className="wa-title">5. Who it&apos;s for</h2>
          <p className="wa-muted">One library, four ways to use it — free, no login.</p>
          <div className="wa-work">
            <div className="wa-work__card"><span/> <h4>Citizens</h4><p>Know your rights in plain words — land, police, marriage, work. Ask in Koloqua, French or Portuguese and hear the answer out loud.</p></div>
            <div className="wa-work__card"><span/> <h4>Students</h4><p>Read the real text behind every case brief, trace what cites what, and build study memos with notes you can print.</p></div>
            <div className="wa-work__card"><span/> <h4>Lawyers</h4><p>Find the binding instrument fast, check its certificate, compare Liberia against ECOWAS/OHADA, and export cited memos.</p></div>
            <div className="wa-work__card"><span/> <h4>Investors & NGOs</h4><p>Enter a new market with eyes open: concessions, tax, land consent and free-movement rules — all cited, all readable.</p></div>
            <div className="wa-work__card wa-work__card--dark"><p>Every answer links to the full text. If it isn&apos;t cited, it isn&apos;t said.</p></div>
          </div>
        </div>
      </section>

      {/* ECOWAS Map — live flags, tap to switch area */}
      <section className="wa-section">
        <div className="wa-container">
          <h2 className="wa-title">Africa — ECOWAS in focus</h2>
          <p className="wa-lead">A live map, not a picture. Every capital flies its flag — <strong>tap any flag</strong> and the whole app (search, AI language, voice, training) switches to that area. Green pulse means fully live.</p>
          <Suspense fallback={<div className="ecowas-map ecowas-map--loading" aria-label="Loading map"><span>Loading live map…</span></div>}>
            <EcowasMap />
          </Suspense>
          <ul className="wa-list" style={{ marginTop: 16 }}>
            <li><strong>12 states, one tap each</strong> — Anglophone, Francophone, Lusophone + Community layer</li>
            <li><strong>Liberia is LIVE</strong> — 590+ laws already searchable; others run on ECOWAS law + comparative reference</li>
            <li><strong>3 legal traditions</strong> co-exist in one platform — not 12 separate apps</li>
          </ul>
        </div>
      </section>

      {/* Badges */}
      <section className="wa-section">
        <div className="wa-container">
          <h2 className="wa-title">6. What each badge means</h2>
          <p className="wa-muted">Look for the badge before you rely on a law. Counts are live.</p>
          <div className="wa-mini-grid">
            <div className="wa-mini"><span>{TIERS.certified}</span><h4>✅ Certified</h4><p>Hand-checked verbatim text from the official source — gazette, court report, referendum text.</p></div>
            <div className="wa-mini"><span>{TIERS.verified}</span><h4>✓ Verified</h4><p>ECOWAS & OHADA instruments from the official treaty depositories.</p></div>
            <div className="wa-mini"><span>{TIERS.reference}</span><h4>• Reference</h4><p>Clearly marked orientation entries. Useful for learning — confirm the gazette before citing in court.</p></div>
            <div className="wa-mini"><span>100%</span><h4>Certificate on every law</h4><p>Each page shows where its text came from and why it binds.</p></div>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="wa-section wa-section--light">
        <div className="wa-container">
          <h2 className="wa-title">7. Coverage today</h2>
          <div className="wa-metrics">
            <div><span>{TOTAL_DOCS}</span><p>legal instruments live</p></div>
            <div><span>179</span><p>years of law, 1847–2026</p></div>
            <div><span>{courtLocations.length}</span><p>courts & legal sites mapped</p></div>
            <div className="dark"><span>12</span><p>topics from land to maritime</p></div>
            <div className="dark"><span>3</span><p>languages: English, French, Portuguese</p></div>
            <div className="dark"><span>15</span><p>Liberian counties covered</p></div>
          </div>
        </div>
      </section>

      {/* Get started */}
      <section className="wa-section">
        <div className="wa-container">
          <h2 className="wa-title">8. Get started in 60 seconds</h2>
          <ol className="wa-steps">
            <li><span>1</span> Pick your country — tap a flag on the map or above; the whole app follows</li>
            <li><span>2</span> Search, or ask the AI in plain words — Koloqua, French or Portuguese welcome</li>
            <li><span>3</span> Check the badge — the certificate shows the source and why the law binds</li>
            <li><span>4</span> Save, brief, print — keep your authorities and export a cited memo</li>
          </ol>
        </div>
      </section>

      <section className="wa-cta">
        <h2>One region. One searchable body of law.</h2>
        <p>{TOTAL_DOCS} instruments live • 12 states • 3 languages • 1847–2026</p>
        <div className="wa-cta__actions">
          <Link to="/about" className="wa-btn wa-btn--light">About LegalCore</Link>
          <Link to="/search" className="wa-btn wa-btn--red">Start searching</Link>
        </div>
        <span>Liberia is live today — free, no login. Other areas open after legal clearance; tap a flag above to preview each one.</span>
      </section>
    </div>
  );
}
