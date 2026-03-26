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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form className={`search-bar search-bar--${size}`} onSubmit={handleSubmit}>
      <div className="search-bar__icon">
        <Search size={size === 'hero' ? 22 : 18} />
      </div>
      <input
        type="text"
        className="search-bar__input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || 'Search statutes, cases, legal opinions...'}
        autoComplete="off"
      />
      <button type="submit" className="search-bar__submit" aria-label="Search">
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
