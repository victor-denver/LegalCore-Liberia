import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, FileText, Gavel, ScrollText } from 'lucide-react';
import { categories, documents, stats } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { tierCounts } from '../data/provenance';
import { ProvenanceBadge } from '../components/Provenance';
import './BrowsePage.css';

const icons = { statute: ScrollText, case: Gavel, opinion: FileText, constitution: BookOpen };
const tiers = tierCounts([...documents, ...ecowasCommunityDocs]);

export default function BrowsePage(){
  const recent=[...documents].sort((a,b)=>b.year-a.year).slice(0,6);
  return (
    <div className="browse">
      <div className="browse-header">
        <div className="browse-header__inner">
          <h1>Browse law by topic</h1>
          <p>Not sure what to search? Tap a topic. We made it simple — even if you’ve never used a law site before.</p>
          <div className="browse-stats">
            <span><strong>{stats.totalDocuments}+</strong> docs</span>
            <span><strong>{stats.categories}</strong> topics</span>
            <span><strong>{stats.yearsSpan}</strong></span>
          </div>
          <div className="browse-stats browse-stats--tiers" title="Certified = hand-checked verbatim • Verified = official treaty source • Reference = structural placeholder being replaced verbatim">
            <span><strong>{tiers.certified}</strong> certified</span>
            <span><strong>{tiers.verified}</strong> verified</span>
            <span><strong>{tiers.reference}</strong> reference</span>
          </div>
        </div>
      </div>

      <div className="browse-content">
        <div className="browse-content__inner">
          <section>
            <h2 className="browse-section-title">All topics — tap to explore</h2>
            <div className="browse-cats">
              {categories.map(c=>(
                <Link key={c.id} to={`/search?category=${c.id}`} className="browse-cat">
                  <div className="browse-cat__left">
                    <h3>{c.label}</h3>
                    <p>{c.description}</p>
                  </div>
                  <div className="browse-cat__right">
                    <span className="browse-cat__count">{c.count}</span>
                    <ArrowRight size={16}/>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="browse-section-title">Newest documents</h2>
            <p className="browse-section-sub">The latest laws we added — tap to read.</p>
            <div className="browse-recent">
              {recent.map(d=>{
                const Icon=icons[d.type];
                return (
                  <Link key={d.id} to={`/document/${d.id}`} className="browse-recent__item">
                    <span className={`browse-recent__icon browse-recent__icon--${d.type}`}><Icon size={16}/></span>
                    <span className="browse-recent__info">
                      <strong>{d.title}</strong>
                      <span>{d.date} • {d.year} • <ProvenanceBadge doc={d} /></span>
                    </span>
                    <ArrowRight size={16} className="browse-recent__arrow"/>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
