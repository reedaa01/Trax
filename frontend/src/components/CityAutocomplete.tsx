'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { MapPin, X } from 'lucide-react';
import { MOROCCAN_CITIES, MoroccanCity } from '@/lib/moroccan-cities';
import clsx from 'clsx';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCitySelect?: (city: MoroccanCity) => void;
  placeholder?: string;
  pinColor?: 'blue' | 'red';
  label?: string;
  error?: string;
  name?: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  onCitySelect,
  placeholder = 'Type a city…',
  pinColor = 'blue',
  label,
  error,
  name,
}: CityAutocompleteProps) {
  const [query,       setQuery]       = useState(value ?? '');
  const [suggestions, setSuggestions] = useState<MoroccanCity[]>([]);
  const [open,        setOpen]        = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Keep internal query in sync when the parent changes the value externally (e.g. map click)
  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

  // Filter city list whenever the query changes
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const filtered = MOROCCAN_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q),
    ).slice(0, 8);
    setSuggestions(filtered);
    setHighlighted(0);
    setOpen(filtered.length > 0);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (city: MoroccanCity) => {
    setQuery(city.name);
    onChange(city.name);
    onCitySelect?.(city);
    setOpen(false);
    inputRef.current?.blur();
  };

  const clear = () => {
    setQuery('');
    onChange('');
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[highlighted]) select(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <MapPin
            className={clsx(
              'inline h-4 w-4 mr-1',
              pinColor === 'blue' ? 'text-blue-500' : 'text-red-500',
            )}
          />
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          name={name}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKey}
          className={clsx(
            'input-field pr-8',
            error && 'border-red-400 focus:ring-red-400',
          )}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Dropdown */}
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
        >
          {suggestions.map((city, i) => (
            <li
              key={city.name}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={(e) => { e.preventDefault(); select(city); }}
              onMouseEnter={() => setHighlighted(i)}
              className={clsx(
                'flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors',
                i === highlighted ? 'bg-brand-50' : 'hover:bg-gray-50',
              )}
            >
              <MapPin
                className={clsx(
                  'h-4 w-4 mt-0.5 shrink-0',
                  pinColor === 'blue' ? 'text-blue-500' : 'text-red-500',
                )}
              />
              <div>
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {highlightMatch(city.name, query)}
                </p>
                <p className="text-xs text-gray-400">{city.region}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Bold the matching part of a city name */
function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (idx === -1 || !query.trim()) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="text-brand-600">{text.slice(idx, idx + query.trim().length)}</strong>
      {text.slice(idx + query.trim().length)}
    </>
  );
}
