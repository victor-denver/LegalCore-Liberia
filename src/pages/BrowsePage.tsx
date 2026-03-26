import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, FileText, Gavel, ScrollText } from 'lucide-react';
import { categories, documents, stats } from '../data/legalData';
import './BrowsePage.css';

const typeIcons = {
  statute: ScrollText,
  case: Gavel,
  opinion: FileText,
  constitution: BookOpen,
};

export default function BrowsePage() {
  const recentDocs = [...documents].sort((a, b) => b.year - a.year).slice(0, 6);

  return (
    <div className="browse-page">
      <div className="browse-page__header">
        <div className="browse-page__header-inner">
          <h1 className="browse-page__title">Browse Library</h1>
          <p className="browse-page__subtitle">
            Explore {stats.totalDocuments}+ Liberian legal documents spanning {stats.yearsSpan}
          </p>
        </div>
      </div>

      <div className="browse-page__content">
        <div className="browse-page__inner">
          <div className="browse-overview">
            <div className="browse-overview__card">
              <span className="browse-overview__number">{stats.totalDocuments}</span>
              <span className="browse-overview__label">Total Documents</span>
            </div>
            <div className="browse-overview__card">
              <span className="browse-overview__number">{stats.statutes}</span>
              <span className="browse-overview__label">Statutes</span>
            </div>
            <div className="browse-overview__card">
              <span className="browse-overview__number">{stats.cases}</span>
              <span className="browse-overview__label">Cases</span>
            </div>
            <div className="browse-overview__card">
              <span className="browse-overview__number">{stats.opinions}</span>
              <span className="browse-overview__label">Opinions</span>
            </div>
          </div>

          <section className="browse-section">
            <h2 className="browse-section__title">Categories ({stats.categories})</h2>
            <div className="browse-categories">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/search?category=${cat.id}`} className="browse-cat-card">
                  <div className="browse-cat-card__info">
                    <h3 className="browse-cat-card__title">{cat.label}</h3>
                    <p className="browse-cat-card__desc">{cat.description}</p>
                  </div>
                  <div className="browse-cat-card__right">
                    <span className="browse-cat-card__count">{cat.count} docs</span>
                    <ArrowRight size={16} className="browse-cat-card__arrow" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="browse-section">
            <h2 className="browse-section__title">Recently Added</h2>
            <div className="browse-recent">
              {recentDocs.map((doc) => {
                const Icon = typeIcons[doc.type];
                return (
                  <Link key={doc.id} to={`/document/${doc.id}`} className="browse-recent-item">
                    <div className={`browse-recent-item__icon browse-recent-item__icon--${doc.type}`}>
                      <Icon size={16} />
                    </div>
                    <div className="browse-recent-item__info">
                      <h4 className="browse-recent-item__title">{doc.title}</h4>
                      <span className="browse-recent-item__date">{doc.date} &middot; {doc.year}</span>
                    </div>
                    <ArrowRight size={16} className="browse-recent-item__arrow" />
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
