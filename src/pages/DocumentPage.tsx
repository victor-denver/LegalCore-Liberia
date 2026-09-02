import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Building2, Tag, FileText, Gavel, ScrollText, BookOpen, Copy, Check, Printer, Share2, Hash, Sparkles, Clock3, ShieldCheck, ListTree, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';
import { documents } from '../data/legalData';
import './DocumentPage.css';

const cfg = {
  statute: { icon: ScrollText, label: 'Statute', cls: 'statute' },
  case: { icon: Gavel, label: 'Case', cls: 'case' },
  opinion: { icon: FileText, label: 'Opinion', cls: 'opinion' },
  constitution: { icon: BookOpen, label: 'Constitution', cls: 'constitution' },
};

export default function DocumentPage(){
  const { id } = useParams<{id:string}>();
  const doc = documents.find(d=>d.id===id);
  const [copied,setCopied]=useState(false);
  const [copiedCite,setCopiedCite]=useState(false);

  if(!doc){
    return <div className="doc"><div className="doc__inner"><div className="doc-empty"><h2>Not found</h2><p>This document doesn’t exist.</p><Link to="/search" className="doc-back"><ArrowLeft size={16}/> Back to search</Link></div></div></div>;
  }
  const c=cfg[doc.type];
  const Icon=c.icon;
  const related=documents.filter(d=>d.id!==doc.id && d.category===doc.category).slice(0,4);
  const headings = useMemo(()=> doc.body.split('\n').filter(l=> l && l===l.toUpperCase() && l.length>3 && !l.startsWith('(')).slice(0,8),[doc.body]);

  const copyText=async()=>{
    await navigator.clipboard.writeText(doc.body);
    setCopied(true); setTimeout(()=>setCopied(false),1500);
  };
  const copyCite=async()=>{
    await navigator.clipboard.writeText(`${doc.title} (${doc.date}) — LegalCore Liberia — https://legalcore.lr/document/${doc.id}`);
    setCopiedCite(true); setTimeout(()=>setCopiedCite(false),1500);
  };

  return (
    <div className="doc">
      <div className="doc__inner">
        <div className="doc-nav">
          <Link to="/search" className="doc-back"><ArrowLeft size={14}/> Back to results</Link>
          <div className="doc-nav__right">
            <span className="doc-nav__hint"><Clock3 size={12}/> ~2 min read • Verified</span>
            <Link to="/ai" className="doc-ai"><Sparkles size={12}/> Ask AI about this</Link>
          </div>
        </div>

        <div className="doc-layout">
          <div className="doc-main">
            <article className="doc-card-main">
              <header className="doc-header">
                <div className="doc-meta">
                  <span className={`doc-tag doc-tag--${c.cls}`}><Icon size={12}/>{c.label}</span>
                  <span className="doc-meta-pill"><Calendar size={12}/>{doc.date}</span>
                  <span className="doc-meta-pill"><Hash size={12}/>{doc.year}</span>
                  {doc.court && <span className="doc-meta-pill"><Building2 size={12}/>{doc.court}</span>}
                  <span className="doc-meta-pill doc-meta-pill--ok"><ShieldCheck size={12}/> Verified</span>
                </div>
                <h1>{doc.title}</h1>
                <p className="doc-summary">{doc.summary}</p>
                <div className="doc-tags">
                  <Tag size={12}/>{doc.tags.map(t=> <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="doc-tag-small">{t}</Link>)}<span className="doc-cat-pill">{doc.category}</span>
                </div>
              </header>

              <div className="doc-toolbar">
                <button className="toolbar-btn toolbar-btn--primary" onClick={copyText}>{copied ? <Check size={14}/> : <Copy size={14}/>}{copied ? 'Copied!' : 'Copy text'}</button>
                <button className="toolbar-btn" onClick={copyCite}>{copiedCite ? <Check size={14}/> : <Copy size={14}/>}{copiedCite ? 'Copied!' : 'Copy citation'}</button>
                <button className="toolbar-btn" onClick={()=>window.print()}><Printer size={14}/> Print</button>
                <button className="toolbar-btn" onClick={()=> navigator.share ? navigator.share({title:doc.title, url:location.href}) : navigator.clipboard.writeText(location.href)}><Share2 size={14}/> Share</button>
                <span className="toolbar-hint">{doc.body.split(' ').length.toLocaleString()} words • {doc.citations.length} citations</span>
              </div>

              <div className="doc-paper">
                <div className="doc-paper__header">
                  <img src="/liberiaFlag.png" alt="Liberia Flag" className="doc-paper__flag-img" />
                  <span className="doc-paper__label">Republic of Liberia — Official Text</span>
                  <span className="doc-paper__id">{doc.id.toUpperCase()}</span>
                </div>
                <div className="doc-body">
                  {doc.body.split('\n').map((line,i)=>{
                    if(!line.trim()) return <br key={i}/>;
                    const isHead= line===line.toUpperCase() && line.length>3 && !line.startsWith('(');
                    if(isHead) return <h3 key={i} id={`h-${i}`} className="doc-h3">{line}</h3>;
                    return <p key={i}>{line}</p>;
                  })}
                </div>
                <div className="doc-paper__footer">
                  <span>LegalCore Liberia — Source verified • {doc.year}</span>
                  <span>Page 1 • {doc.type}</span>
                </div>
              </div>

              {doc.citations.length>0 && (
                <div className="doc-citations">
                  <h3><ExternalLink size={12}/> Citations & Authority</h3>
                  <ul>
                    {doc.citations.map((cit,i)=>(
                      <li key={i}><span className="cite-n">{i+1}</span><span>{cit}</span><button className="cite-copy" onClick={()=>navigator.clipboard.writeText(cit)}><Copy size={12}/></button></li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            {/* Mobile related */}
            {related.length>0 && (
              <section className="related related--mobile">
                <h3>Related in {doc.category}</h3>
                <div className="related-grid">
                  {related.map(rd=>{
                    const rc=cfg[rd.type];
                    const RI=rc.icon;
                    return (
                      <Link key={rd.id} to={`/document/${rd.id}`} className="related-card">
                        <span className={`doc-tag doc-tag--${rc.cls}`}><RI size={11}/>{rc.label}</span>
                        <strong>{rd.title}</strong>
                        <p>{rd.summary.slice(0,100)}…</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="doc-aside">
            <div className="doc-aside__card doc-aside__card--ai">
              <div className="doc-aside__ai-head"><Sparkles size={14}/> Ask AI about this law</div>
              <p>Get a plain-English summary, key points, and how it applies — cited.</p>
              <Link to={`/ai?q=${encodeURIComponent(doc.title)}`} className="doc-aside__ai-btn">Ask AI <ExternalLink size={12}/></Link>
              <span className="doc-aside__ai-note">Knows all {documents.length} laws • Never guesses</span>
            </div>

            <div className="doc-aside__card">
              <h4><ListTree size={14}/> On this page</h4>
              {headings.length ? (
                <nav className="doc-toc">
                  {headings.map((h,i)=>(<a key={i} href={`#h-${doc.body.split('\n').indexOf(h)}`} className="doc-toc__link">{h.slice(0,48)}{h.length>48?'…':''}</a>))}
                </nav>
              ) : <p className="doc-aside__muted">Full text below — use Copy or Print.</p>}
            </div>

            <div className="doc-aside__card">
              <h4><ShieldCheck size={14}/> At a glance</h4>
              <div className="doc-aside__kv"><span>Type</span><strong>{c.label}</strong></div>
              <div className="doc-aside__kv"><span>Year</span><strong>{doc.year}</strong></div>
              <div className="doc-aside__kv"><span>Category</span><strong>{doc.category}</strong></div>
              {doc.court && <div className="doc-aside__kv"><span>Court</span><strong>{doc.court}</strong></div>}
              <div className="doc-aside__kv"><span>Words</span><strong>{doc.body.split(' ').length.toLocaleString()}</strong></div>
              <div className="doc-aside__tags">
                {doc.tags.slice(0,6).map(t=> <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="doc-aside__tag">{t}</Link>)}
              </div>
            </div>

            {related.length>0 && (
              <div className="doc-aside__card doc-aside__card--related">
                <h4>Related</h4>
                <div className="doc-aside__related">
                  {related.map(rd=>{
                    const rc=cfg[rd.type];
                    return (
                      <Link key={rd.id} to={`/document/${rd.id}`} className="doc-aside__related-item">
                        <span className={`doc-tag doc-tag--${rc.cls}`} style={{fontSize:10, padding:'2px 6px'}}>{rc.label}</span>
                        <strong>{rd.title}</strong>
                        <span>{rd.year} • {rd.date}</span>
                      </Link>
                    );
                  })}
                </div>
                <Link to={`/search?category=${doc.category}`} className="doc-aside__viewall">View all in {doc.category} →</Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
