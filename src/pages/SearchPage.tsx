import { useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import DocumentCard from '../components/DocumentCard';
import { documents, categories, type DocumentType, type LegalCategory } from '../data/legalData';
import './SearchPage.css';

const typeFilters: { value: DocumentType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'constitution', label: 'Constitution' },
  { value: 'statute', label: 'Statutes' },
  { value: 'case', label: 'Case Law' },
  { value: 'opinion', label: 'Legal Opinions' },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<LegalCategory | 'all'>(
    (categoryParam as LegalCategory) || 'all'
  );
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    let filtered = [...documents];

    if (queryParam) {
      const q = queryParam.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.summary.toLowerCase().includes(q) ||
          doc.tags.some((t) => t.toLowerCase().includes(q)) ||
          doc.body.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
    }

    return filtered;
  }, [queryParam, typeFilter, categoryFilter]);

  const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all';

  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
  };

  return (
    <div className="search-page">
      <div className="search-page__header">
        <div className="search-page__header-inner">
          <div className="search-page__search-row">
            <SearchBar initialQuery={queryParam} />
          </div>

          <div className="search-page__controls">
            <div className="search-page__result-count">
              <span className="search-page__count">{results.length}</span> result{results.length !== 1 ? 's' : ''}
              {queryParam && <> for <strong>"{queryParam}"</strong></>}
            </div>

            <button
              className={`search-page__filter-toggle ${showFilters ? 'search-page__filter-toggle--active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && <span className="search-page__filter-dot" />}
            </button>
          </div>

          {showFilters && (
            <div className="search-page__filters animate-in">
              <div className="filter-group">
                <label className="filter-group__label">
                  <Filter size={13} />
                  Document Type
                </label>
                <div className="filter-group__options">
                  {typeFilters.map((tf) => (
                    <button
                      key={tf.value}
                      className={`filter-chip ${typeFilter === tf.value ? 'filter-chip--active' : ''}`}
                      onClick={() => setTypeFilter(tf.value)}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-group__label">
                  <Filter size={13} />
                  Category
                </label>
                <div className="filter-group__options">
                  <button
                    className={`filter-chip ${categoryFilter === 'all' ? 'filter-chip--active' : ''}`}
                    onClick={() => setCategoryFilter('all')}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`filter-chip ${categoryFilter === cat.id ? 'filter-chip--active' : ''}`}
                      onClick={() => setCategoryFilter(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button className="filter-clear" onClick={clearFilters}>
                  <X size={14} />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="search-page__results">
        <div className="search-page__results-inner">
          {results.length > 0 ? (
            <div className="search-page__results-grid">
              {results.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          ) : (
            <div className="search-page__empty">
              <p className="search-page__empty-title">No results found</p>
              <p className="search-page__empty-text">
                Try adjusting your search terms or filters. You can also{' '}
                <button className="search-page__empty-link" onClick={clearFilters}>
                  clear all filters
                </button>{' '}
                to see all documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
