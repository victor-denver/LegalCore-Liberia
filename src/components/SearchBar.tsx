import { Search, ArrowRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

interface SearchBarProps {
  size?: 'default' | 'hero';
  initialQuery?: string;
  placeholder?: string;
}

export default function SearchBar({ size = 'default', initialQuery = '', placeholder }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };
  return (
    <form className={`search-bar search-bar--${size}`} onSubmit={onSubmit} role="search">
      <div className="search-bar__field">
        <Search size={20} className="search-bar__icon" />
        <input
          type="text"
          className="search-bar__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Search law — misspellings are fine'}
          aria-label="Search law"
        />
        <button type="submit" className="search-bar__btn" aria-label="Search">
          <span className="search-bar__btn-text">Search</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
