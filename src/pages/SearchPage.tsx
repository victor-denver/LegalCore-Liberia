import { useSearchParams, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X, Search, Sparkles, Clock3, Info } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import DocumentCard from '../components/DocumentCard';
import { documents, categories, type DocumentType, type LegalCategory } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { detectJurisdictionInQuery } from '../data/jurisdictions';
import { rankDocuments } from '../utils/smartSearch';
import { track } from '../lib/analytics';
import RequestLawButton from '../components/RequestLawButton';
import './SearchPage.css';

const searchCorpus = [...documents, ...ecowasCommunityDocs];

const typeFilters:{value:DocumentType|'all';label:string}[]=[
  {value:'all',label:'All'},
  {value:'constitution',label:'Constitution'},
  {value:'statute',label:'Statutes'},
  {value:'case',label:'Cases'},
  {value:'opinion',label:'Opinions'},
];

export default function SearchPage(){
  const [searchParams]=useSearchParams();
  const qParam=searchParams.get('q')||'';
  const catParam=searchParams.get('category')||'';
  const [typeFilter,setTypeFilter]=useState<DocumentType|'all'>('all');
  const [catFilter,setCatFilter]=useState<LegalCategory|'all'>((catParam as LegalCategory)||'all');
  const [showFilters,setShowFilters]=useState(false);
  const [sortBy,setSortBy]=useState<'relevance'|'newest'|'oldest'>('relevance');
  const { code: activeCode, active: activeJ, setCode } = useJurisdiction();

  useEffect(() => {
    if (!qParam) return;
    const named = detectJurisdictionInQuery(qParam);
    if (named && named !== 'ECOWAS' && named !== activeCode) setCode(named);
  }, [qParam, activeCode, setCode]);

  const results=useMemo(()=>{
    let f=[...searchCorpus];
    if(qParam){
      const named = detectJurisdictionInQuery(qParam);
      const prefer = named && named !== 'ECOWAS' ? named : activeCode;
      const jRank = (d: typeof f[number]) => {
        const j = (d as { jurisdiction?: string }).jurisdiction ?? 'LR';
        if (j === prefer) return 0;
        if (j === 'ECOWAS') return 1;
        return 2;
      };
      const ranked = rankDocuments(f, qParam);
      f = [...ranked].sort((a, b) => {
        const jr = jRank(a) - jRank(b);
        if (jr !== 0) return jr;
        return ranked.indexOf(a) - ranked.indexOf(b);
      });
    }
    if(typeFilter!=='all') f=f.filter(d=>d.type===typeFilter);
    if(catFilter!=='all') f=f.filter(d=>d.category===catFilter);
    if(sortBy==='newest') f.sort((a,b)=>b.year-a.year);
    if(sortBy==='oldest') f.sort((a,b)=>a.year-b.year);
    return f;
  },[qParam,typeFilter,catFilter,sortBy,activeCode]);

  const hasFilters=typeFilter!=='all'||catFilter!=='all';
  const clear=()=>{setTypeFilter('all');setCatFilter('all');};

  // Analytics: one row per distinct query (debounced so typing doesn't spam).
  useEffect(() => {
    if (!qParam.trim()) return;
    const t = setTimeout(() => track('search', { q: qParam.trim(), results: results.length, country: activeCode }), 800);
    return () => clearTimeout(t);
  }, [qParam, results.length, activeCode]);

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-header__inner">
          <h1 className="search-header__title">Search {activeJ.name} Law</h1>
          <p className="search-header__sub">Type the way you talk — misspellings are fine. We match what you meant{activeJ.language === 'fr' ? ' — posez aussi en français' : activeJ.language === 'pt' ? ' — pergunte também em português' : ''}.</p>
          <div className="search-header__bar">
            <SearchBar key={qParam} initialQuery={qParam} />
          </div>
          <div className="search-header__helper">
            <Info size={12}/> Try: <Link to="/search?q=criminal%20law%20in%20liber">criminal law in liber</Link> • <Link to="/search?q=land%20rights">land rights</Link> • <Link to="/search?q=Article%2020">Article 20</Link>
          </div>

          <div className="search-controls">
            <div className="search-controls__left">
              <span className="results-count"><strong>{results.length}</strong> results {qParam && <>for “{qParam}”</>} <span className="results-time"><Clock3 size={11}/> ~18ms</span></span>
            </div>
            <div className="search-controls__right">
              <div className="sort-pills">
                {(['relevance','newest','oldest'] as const).map(s=>(
                  <button key={s} className={`sort-pill ${sortBy===s?'sort-pill--active':''}`} onClick={()=>setSortBy(s)}>{s}</button>
                ))}
              </div>
              <button className={`filter-btn ${showFilters?'filter-btn--active':''}`} onClick={()=>setShowFilters(!showFilters)}>
                <SlidersHorizontal size={14}/> Filters {hasFilters && <span className="filter-dot"/>}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filters-group">
                <span className="filters-label">Type</span>
                <div className="filters-options">
                  {typeFilters.map(t=>(
                    <button key={t.value} className={`chip ${typeFilter===t.value?'chip--active':''}`} onClick={()=>setTypeFilter(t.value)}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="filters-group">
                <span className="filters-label">Category</span>
                <div className="filters-options">
                  <button className={`chip ${catFilter==='all'?'chip--active':''}`} onClick={()=>setCatFilter('all')}>All</button>
                  {categories.map(c=>(
                    <button key={c.id} className={`chip ${catFilter===c.id?'chip--active':''}`} onClick={()=>setCatFilter(c.id)}>{c.label}</button>
                  ))}
                </div>
              </div>
              {hasFilters && <button className="filters-clear" onClick={clear}><X size={14}/> Clear filters</button>}
            </div>
          )}
        </div>
      </div>

      <div className="search-results">
        <div className="search-results__inner">
          {results.length>0 ? (
            <div className="results-grid">
              {results.map(d=> <DocumentCard key={d.id} doc={d} />)}
            </div>
          ) : (
            <div className="empty">
              <div className="empty__icon"><Search size={20}/></div>
              <h3>No results for “{qParam || 'filters'}”</h3>
              <p>Try a simpler word — even a misspelling like “liber” or “crimnal” should work — or ask AI. If the law exists but we don't have it yet, tell us and we'll source it.</p>
              <div className="empty__actions">
                <button className="btn btn--dark" onClick={clear}>Clear filters</button>
                <Link to="/ai" className="btn btn--red"><Sparkles size={14}/> Ask AI</Link>
                {qParam && <RequestLawButton query={qParam} country={activeCode} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
