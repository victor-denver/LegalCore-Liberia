import { Link, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { documents, courtLocations } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { tierCounts } from '../data/provenance';
import './WestAfricaPage.css';

type HeroTile = { src: string; alt: string };
type HeroCol = { width: 'wide' | 'mid' | 'portrait'; tiles: HeroTile[] };

const HERO_COLS: HeroCol[] = [
  { width: 'wide', tiles: [
    { src: '/herosection/hero-tile-courthouse.png', alt: 'West African courthouse at golden hour' },
    { src: '/herosection/hero-library.png', alt: 'Lawyers and students in a West African law library' },
  ]},
  { width: 'portrait', tiles: [
    { src: '/herosection/hero-tile-lawyer.png', alt: 'West African lawyer in a courthouse corridor' },
  ]},
  { width: 'mid', tiles: [
    { src: '/herosection/hero-tile-gavel.png', alt: 'Gavel and scales of justice' },
    { src: '/herosection/hero-tile-students.png', alt: 'Law students with statutes and a laptop' },
  ]},
  { width: 'wide', tiles: [
    { src: '/herosection/hero-tile-skyline.png', alt: 'West African capital at dusk' },
    { src: '/herosection/hero-tile-night.png', alt: 'Coastal capital at blue hour' },
  ]},
  { width: 'portrait', tiles: [
    { src: '/herosection/hero-tile-judge.png', alt: 'Judge at the courthouse door' },
  ]},
  { width: 'mid', tiles: [
    { src: '/herosection/hero-tile-assembly.png', alt: 'Regional assembly hall' },
    { src: '/herosection/hero-tile-market.png', alt: 'Citizen reading the law on a phone' },
  ]},
  { width: 'portrait', tiles: [
    { src: '/herosection/hero-tile-books.png', alt: 'Leather-bound law reporters' },
  ]},
  { width: 'wide', tiles: [
    { src: '/herosection/hero-tile-chamber.png', alt: 'Supreme Court chamber' },
    { src: '/herosection/hero-tile-notes.png', alt: 'Annotating a statute' },
  ]},
];

/** Copies of the strip laid end to end. Three is enough that the seam is always
 *  off-screen, even on very wide monitors. */
const LOOPS = [0, 1, 2];
/** Drift speed of the gallery, px/second. Slow enough to actually look at. */
const DRIFT = 26;
/** How far one arrow click travels. */
const STEP = 380;
/** Auto-scroll stays out of the way for this long after the reader takes over. */
const HOLD_MS = 2600;

// Heavy MapLibre GL chunk loads only when this page renders.
const EcowasMap = lazy(() => import('../components/EcowasMap'));

const TOTAL_DOCS = documents.length + ecowasCommunityDocs.length;
const TIERS = tierCounts([...documents, ...ecowasCommunityDocs]);

export default function WestAfricaPage(){
  const navigate = useNavigate();
  const { code: activeCode, setCode } = useJurisdiction();

  const gridRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<() => void>(() => {});

  const chooseCountry = (code: string, status: string) => {
    setCode(code.toUpperCase());
    // Liberia library → search; every other area → AI re-trained on that country.
    navigate(status === 'active' ? '/search' : '/ai');
  };

  /** Width of one copy of the strip, including the gap before the next copy. */
  const lapWidth = () => {
    const track = gridRef.current;
    const loop = loopRef.current;
    if (!track || !loop) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return loop.offsetWidth + gap;
  };

  const scrollHero = (dir: number) => {
    const track = gridRef.current;
    if (!track) return;
    holdRef.current();
    // Hop forward a whole lap before stepping back past the start, so the arrows
    // are endless in both directions rather than hitting a wall at zero.
    if (dir < 0 && track.scrollLeft < STEP) track.scrollLeft += lapWidth();
    track.scrollBy({ left: dir * STEP, behavior: 'smooth' });
  };

  // Continuous drift. Yields to the reader: pauses on hover, on keyboard focus,
  // while off-screen or on a hidden tab, and for a beat after any manual scroll.
  useEffect(() => {
    const track = gridRef.current;
    const loop = loopRef.current;
    if (!track || !loop) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let hovered = false;
    let offscreen = false;
    let resumeAt = 0;
    let last = 0;
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const idle = hovered || offscreen || document.hidden || now < resumeAt;
      if (idle) { last = now; return; }
      if (!last) { last = now; return; }
      // Clamp the delta so returning to a backgrounded tab doesn't lurch.
      const dt = Math.min(now - last, 48) / 1000;
      last = now;

      track.scrollLeft += DRIFT * dt;
      const lap = loop.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
      if (lap > 0 && track.scrollLeft >= lap) track.scrollLeft -= lap;
    };
    raf = requestAnimationFrame(frame);

    const hold = () => { resumeAt = performance.now() + HOLD_MS; };
    holdRef.current = hold;

    const enter = () => { hovered = true; };
    const leave = () => { hovered = false; };

    track.addEventListener('mouseenter', enter);
    track.addEventListener('mouseleave', leave);
    track.addEventListener('focusin', enter);
    track.addEventListener('focusout', leave);
    track.addEventListener('touchstart', hold, { passive: true });
    track.addEventListener('wheel', hold, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => { offscreen = !entry.isIntersecting; },
      { threshold: 0 },
    );
    io.observe(track);

    return () => {
      cancelAnimationFrame(raf);
      holdRef.current = () => {};
      track.removeEventListener('mouseenter', enter);
      track.removeEventListener('mouseleave', leave);
      track.removeEventListener('focusin', enter);
      track.removeEventListener('focusout', leave);
      track.removeEventListener('touchstart', hold);
      track.removeEventListener('wheel', hold);
      io.disconnect();
    };
  }, []);

  return (
    <div className="wa">
      <section className="wa-hero">
        <div className="wa-hero__intro">
          <div className="wa-hero__copy">
            <span className="wa-hero__chip">
              <b>Live</b>
              Liberia library · {TOTAL_DOCS} instruments · 12 ECOWAS states
            </span>
            <h1>One body of law<br /><span>For every West African</span></h1>
          </div>
          <div className="wa-hero__aside">
            <p>Search, cite, and understand primary law across ECOWAS — starting with Liberia, live today. Every answer links to the full text.</p>
            <div className="wa-hero__actions">
              <Link to="/search" className="wa-hero__btn wa-hero__btn--primary">Search the law</Link>
              <Link to="/ai" className="wa-hero__btn wa-hero__btn--ghost">Ask AI</Link>
            </div>
          </div>
        </div>

        <div className="wa-hero__strip">
          <span className="wa-hero__made">From the library</span>
          <Link to="/browse">See more</Link>
          <div className="wa-hero__arrows">
            <button type="button" aria-label="Previous images" onClick={() => scrollHero(-1)}><ChevronLeft size={16} /></button>
            <button type="button" aria-label="Next images" onClick={() => scrollHero(1)}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="wa-hero__track" ref={gridRef}>
          {LOOPS.map((copy) => (
            <div
              key={copy}
              className="wa-hero__loop"
              ref={copy === 0 ? loopRef : undefined}
              aria-hidden={copy > 0 || undefined}
            >
              {HERO_COLS.map((col, i) => (
                <div key={i} className={`wa-hero__col wa-hero__col--${col.width}`}>
                  {col.tiles.map((tile) => (
                    <figure key={tile.src} className="wa-hero__tile">
                      <img src={tile.src} alt={copy === 0 ? tile.alt : ''} />
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ECOWAS banner strip */}
      <section className="wa-ecowas-banner">
        <div className="wa-ecowas-banner__inner">
          <img src="/design-assets/ecowas-logo.png" alt="ECOWAS — Economic Community of West African States" className="wa-ecowas-banner__logo" />
          <div className="wa-ecowas-banner__text">
            <span>Economic Community of West African States</span>
            <span className="wa-ecowas-banner__sep">·</span>
            <span>12 Member States</span>
            <span className="wa-ecowas-banner__sep">·</span>
            <span>One Vision, One Region</span>
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      <section className="wa-section">
        <div className="wa-container">
          <h2 className="wa-title"><span className="wa-num">01.</span>Executive Summary</h2>
          <p className="wa-lead">LegalCore Liberia has proven the thesis in a single jurisdiction: lawyers, judges, students and businesses need fast, searchable and reliable access to primary law. That problem is far larger across West Africa, where most national law exists only in paper gazettes, out-of-print codes, or scattered PDFs — with no consolidation, version history or citator.</p>
          <div className="wa-callout">
            <strong>LegalCore West Africa</strong> is a single, multilingual, multi-jurisdiction platform covering legislation, case law and community instruments of the ECOWAS region. <strong>Liberia is live today with {TOTAL_DOCS} instruments (1847–2026)</strong> — Anglophone states go next, then Francophone, then Lusophone + Community law, each the day its corpus clears legal review.
          </div>
          <div className="wa-grid3">
            <div className="wa-card"><span className="wa-card__num">01</span><h4>Sequence by legal tradition, not geography</h4><p>Anglophone common-law first — citation conventions match Liberia. Francophone civil law is a re-architecture, not translation.</p></div>
            <div className="wa-card"><span className="wa-card__num">02</span><h4>Treat legal clearance as a gate</h4><p>Whether law can be republished varies by country. No country enters the queue before clearance is documented.</p></div>
            <div className="wa-card"><span className="wa-card__num">03</span><h4>Build for authority, not volume</h4><p>One verified statute is worth a hundred scraped docs. Trust, once lost, is not recoverable.</p></div>
          </div>
        </div>
      </section>

      {/* Jurisdictional Map */}
      <section className="wa-section wa-section--dark">
        <div className="wa-container">
          <h2 className="wa-title wa-title--white"><span className="wa-num">02.</span>Scope: The Jurisdictional Map</h2>
          <p className="wa-muted">ECOWAS currently comprises 12 member states. Burkina Faso, Mali and Niger withdrew effective 29 Jan 2025 — treated separately.</p>
          <div className="wa-table">
            <div className="wa-table__head"><span>Cluster</span><span>Member states</span><span>Legal tradition</span><span>Language</span></div>
            <div className="wa-table__row"><span>Anglophone common law</span><span>Liberia, Nigeria, Ghana, Sierra Leone, The Gambia</span><span>Common law (Liberia US-influenced; others English)</span><span>English</span></div>
            <div className="wa-table__row"><span>Francophone civil law</span><span>Senegal, Côte d’Ivoire, Benin, Togo, Guinea</span><span>Civil law, French-derived</span><span>French</span></div>
            <div className="wa-table__row"><span>Lusophone civil law</span><span>Cabo Verde, Guinea-Bissau</span><span>Civil law, Portuguese-derived</span><span>Portuguese</span></div>
            <div className="wa-table__row"><span>Community layer</span><span>ECOWAS institutions</span><span>Treaty law</span><span>EN / FR / PT</span></div>
          </div>
          <div className="wa-mini-grid">
            <div className="wa-mini"><span>01</span><h4>ECOWAS Community law</h4><p>Revised Treaty, Protocols, Regulations, Directives + Community Court jurisprudence.</p></div>
            <div className="wa-mini"><span>02</span><h4>OHADA Uniform Acts</h4><p>Directly applicable business law in 6 states + CCJA case law. Highest commercial value.</p></div>
            <div className="wa-mini"><span>03</span><h4>Customary & religious law</h4><p>Recognised in nearly every state — carried as secondary, never primary.</p></div>
            <div className="wa-mini"><span>04</span><h4>Sub-national law</h4><p>Nigeria’s 36 states + FCT — 37 jurisdictions, budgeted as such.</p></div>
          </div>
          <div className="wa-note">Sahel track (optional, Phase 4): Burkina Faso, Mali, Niger remain OHADA members — covered as “West Africa Extended” kept editorially separate from ECOWAS.</div>
        </div>
      </section>

      {/* ECOWAS Countries — Chooser with flags */}
      <section className="wa-section wa-countries-sec">
        <div className="wa-container">
          <h2 className="wa-title">Choose your country</h2>
          <div className="wa-countries-rule">
            <span>12 ECOWAS states</span>
            <span>Tap a flag — search, AI and voice follow</span>
          </div>
          <div className="wa-countries">
            {[
              { code:'lr', name:'Liberia', capital:'Monrovia', lang:'English', tradition:'Common law', status:'active', docs:'590+' },
              { code:'sl', name:'Sierra Leone', capital:'Freetown', lang:'English', tradition:'Common law', status:'next' },
              { code:'gh', name:'Ghana', capital:'Accra', lang:'English', tradition:'Common law', status:'queued' },
              { code:'gm', name:'The Gambia', capital:'Banjul', lang:'English', tradition:'Common law', status:'queued' },
              { code:'ng', name:'Nigeria', capital:'Abuja', lang:'English', tradition:'Common law (37 jurisdictions)', status:'queued' },
              { code:'sn', name:'Senegal', capital:'Dakar', lang:'French', tradition:'Civil law', status:'queued' },
              { code:'ci', name:"Côte d'Ivoire", capital:'Yamoussoukro', lang:'French', tradition:'Civil law', status:'queued' },
              { code:'bj', name:'Benin', capital:'Porto-Novo', lang:'French', tradition:'Civil law', status:'queued' },
              { code:'tg', name:'Togo', capital:'Lomé', lang:'French', tradition:'Civil law', status:'queued' },
              { code:'gn', name:'Guinea', capital:'Conakry', lang:'French', tradition:'Civil law', status:'queued' },
              { code:'cv', name:'Cabo Verde', capital:'Praia', lang:'Portuguese', tradition:'Civil law', status:'queued' },
              { code:'gw', name:'Guinea-Bissau', capital:'Bissau', lang:'Portuguese', tradition:'Civil law', status:'queued' },
            ].map(c=> (
              <button
                key={c.code}
                type="button"
                className={`wa-country ${activeCode===c.code.toUpperCase()?'wa-country--viewing':''} ${c.status==='active'?'wa-country--live':''}`}
                onClick={()=>chooseCountry(c.code, c.status)}
              >
                <img src={`https://flagcdn.com/w160/${c.code}.png`} srcSet={`https://flagcdn.com/w320/${c.code}.png 2x`} alt="" className="wa-country__flag" loading="lazy" />
                <strong>{c.name}</strong>
                <span>{c.status==='active' ? 'Live' : c.status==='next' ? 'Next' : 'Soon'}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Guiding Principles */}
      <section className="wa-section wa-section--alt">
        <div className="wa-container">
          <h2 className="wa-title"><span className="wa-num">03.</span>Guiding Principles</h2>
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
          <h2 className="wa-title"><span className="wa-num">04.</span>Phased Roadmap</h2>
          <p className="wa-muted" style={{marginBottom:16}}>No area goes live before its corpus clears legal review. Status is shown honestly below.</p>
          <div className="wa-roadmap">
            <div className="wa-phase wa-phase--dark"><span>PHASE 0</span><h4>Foundations</h4><p>✅ Live now</p><p>Liberia on the multi-jurisdiction model: full library, per-country AI, certificates on every law, court map.</p><em>Live: {TOTAL_DOCS} instruments, 1847–2026, free with no login</em></div>
            <div className="wa-phase"><span>PHASE 1</span><h4>Anglophone</h4><p>Next</p><p>Sierra Leone, Ghana, The Gambia, Nigeria — federal first, then states.</p><em>Goes live corpus by corpus as each clears review</em></div>
            <div className="wa-phase"><span>PHASE 2</span><h4>Francophone</h4><p>Queued</p><p>Senegal, Côte d’Ivoire, Benin, Togo, Guinea + OHADA module.</p><em>OHADA guides already live in the Community layer</em></div>
            <div className="wa-phase"><span>PHASE 3</span><h4>Lusophone</h4><p>Queued</p><p>Cabo Verde, Guinea-Bissau + ECOWAS Community law & Court.</p><em>Free-movement + Court protocol already live</em></div>
          </div>
          <p className="wa-footnote">Later: deeper history, analytics, practice tools. Why this order: it follows legal traditions, so citations and procedures carry over instead of starting from zero.</p>
        </div>
      </section>

      {/* Who it's for — icon badges from design doc */}
      <section className="wa-section">
        <div className="wa-container">
          <h2 className="wa-title"><span className="wa-num">05.</span>Who it&apos;s for</h2>
          <p className="wa-muted">One library, four ways to use it — free, no login.</p>
          <div className="wa-work wa-work--4col">
            <div className="wa-work__card wa-work__card--icon">
              <div className="wa-work__badge">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="20" cy="16" r="8" fill="#F7B733"/><circle cx="32" cy="16" r="6" fill="#F7B733" opacity="0.6"/><path d="M4 42c0-8.8 7.2-16 16-16 2.2 0 4.3.4 6.2 1.2" stroke="#FFF8EC" strokeWidth="2.5" fill="none"/><rect x="24" y="8" width="16" height="10" rx="3" fill="#FFF8EC" opacity="0.8"/></svg>
              </div>
              <h4>Citizens</h4>
              <p>Know your rights in plain words — land, police, marriage, work. Ask in English, French or Portuguese and hear the answer out loud.</p>
            </div>
            <div className="wa-work__card wa-work__card--icon">
              <div className="wa-work__badge">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="30" cy="14" r="8" fill="#F7B733" opacity="0.6"/><rect x="8" y="10" width="22" height="28" rx="3" fill="#FFF8EC" opacity="0.8"/><line x1="12" y1="18" x2="26" y2="18" stroke="#0F5233" strokeWidth="2"/><line x1="12" y1="24" x2="22" y2="24" stroke="#0F5233" strokeWidth="2"/><line x1="12" y1="30" x2="24" y2="30" stroke="#0F5233" strokeWidth="2"/></svg>
              </div>
              <h4>Students</h4>
              <p>Read the real text behind every case brief, trace what cites what, and build study memos with notes you can print.</p>
            </div>
            <div className="wa-work__card wa-work__card--icon">
              <div className="wa-work__badge">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="16" width="32" height="22" rx="3" fill="#F7B733"/><rect x="14" y="12" width="20" height="8" rx="2" fill="#FFF8EC" opacity="0.8"/><circle cx="24" cy="26" r="3" fill="#0F5233"/></svg>
              </div>
              <h4>Lawyers</h4>
              <p>Find the binding instrument fast, check its certificate, compare Liberia against ECOWAS/OHADA, and export cited memos.</p>
            </div>
            <div className="wa-work__card wa-work__card--icon">
              <div className="wa-work__badge">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M24 6L6 18v24h36V18L24 6z" fill="#F7B733"/><rect x="14" y="22" width="4" height="16" fill="#0F5233"/><rect x="22" y="22" width="4" height="16" fill="#0F5233"/><rect x="30" y="22" width="4" height="16" fill="#0F5233"/><rect x="10" y="18" width="28" height="4" fill="#FFF8EC" opacity="0.8"/></svg>
              </div>
              <h4>Institutions</h4>
              <p>Enter a new market with eyes open: concessions, tax, land consent and free-movement rules — all cited, all readable.</p>
            </div>
          </div>
          <div className="wa-work__motto">Every answer links to the full text. If it isn&apos;t cited, it isn&apos;t said.</div>
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
            <li><strong>Liberia is LIVE</strong> — {TOTAL_DOCS} instruments already searchable; others run on ECOWAS law + comparative reference</li>
            <li><strong>3 legal traditions</strong> co-exist in one platform — not 12 separate apps</li>
          </ul>
        </div>
      </section>

      {/* Badges */}
      <section className="wa-section wa-section--alt">
        <div className="wa-container">
          <h2 className="wa-title"><span className="wa-num">06.</span>What each badge means</h2>
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
          <h2 className="wa-title"><span className="wa-num">07.</span>Coverage today</h2>
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
      <section className="wa-section wa-section--alt">
        <div className="wa-container">
          <h2 className="wa-title"><span className="wa-num">08.</span>Get started in 60 seconds</h2>
          <div className="wa-steps">
            <div><span>01</span>Pick your country — tap a flag on the map or above; the whole app follows</div>
            <div><span>02</span>Search, or ask the AI in plain words — English, French or Portuguese welcome</div>
            <div><span>03</span>Check the badge — the certificate shows the source and why the law binds</div>
            <div><span>04</span>Save, brief, print — keep your authorities and export a cited memo</div>
          </div>
        </div>
      </section>

      <section className="wa-cta">
        <h2>One region.<br/>One searchable body of law.</h2>
        <p>{TOTAL_DOCS} instruments live · 12 states · 3 languages · 1847–2026</p>
        <div className="wa-cta__actions">
          <Link to="/about" className="wa-btn wa-btn--light">About LegalCore</Link>
          <Link to="/search" className="wa-btn wa-btn--red">Start searching →</Link>
        </div>
        <span>Free, no login. Liberia is live today.</span>
      </section>
    </div>
  );
}
