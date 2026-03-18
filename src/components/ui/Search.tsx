// src/components/ui/Search.tsx
// ─────────────────────────────────────────────────────────────────────────────
// A search input that filters the globe and gallery by artwork title or artist.
//
// TEACHING CONCEPTS:
//  • Controlled input: React owns the value via state
//  • Debouncing: we wait 250ms after the user stops typing before applying the
//    filter. This avoids running the filter on every single keystroke.
//  • useEffect with cleanup: the debounce timer is cleaned up if the component
//    unmounts or the value changes again before the timer fires.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

export default function Search() {
  // Local state tracks what's in the input box right now
  const [localValue, setLocalValue] = useState('');
  // Action from Zustand store — updates the global search query
  const setSearch = useAppStore(state => state.setSearch);

  // ── Debounce Effect ───────────────────────────────────────────────────────
  useEffect(() => {
    // Set a timer: after 250ms of no typing, apply the filter
    const timer = setTimeout(() => {
      setSearch(localValue);
    }, 250);

    // Cleanup: if the user types again before 250ms, cancel the old timer
    // so we don't end up with multiple stale filter updates firing.
    return () => clearTimeout(timer);
  }, [localValue, setSearch]);

  return (
    <div className="search-wrapper">
      {/* Magnifying glass icon (SVG inline, no image file needed) */}
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        type="text"
        className="search-input"
        placeholder="Search art or artist..."
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        // Unique ID for accessibility
        id="art-search-input"
        aria-label="Search public art by title or artist name"
      />

      {/* Clear button — only visible when there's text */}
      {localValue && (
        <button
          className="search-clear"
          onClick={() => { setLocalValue(''); setSearch(''); }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
