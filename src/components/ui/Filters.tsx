// src/components/ui/Filters.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Toggle buttons for filtering art by era (25-year chunks) and medium type.
//
// TEACHING CONCEPTS:
//  • Derived state: we read the active filters from Zustand but never store
//    them locally — the toggle buttons derive their "active" appearance from
//    the global store, not from any component-level state.
//  • Array.includes() to check if a filter is active
//  • Collapsible panel using CSS transitions
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ERA_BUCKETS } from '../../utils/filterArt';
import type { ArtMedium } from '../../types/art';

// The five medium categories with emoji labels for visual appeal
const MEDIUMS: { label: ArtMedium; emoji: string }[] = [
  { label: 'Sculpture', emoji: '🗿' },
  { label: 'Mural',     emoji: '🎨' },
  { label: 'Monument',  emoji: '🏛️' },
  { label: 'Fountain',  emoji: '💧' },
  { label: 'Other',     emoji: '✨' },
];

export default function Filters() {
  // Read active filters and toggle actions from the global store
  const filters     = useAppStore(state => state.filters);
  const toggleEra   = useAppStore(state => state.toggleEra);
  const toggleMedium = useAppStore(state => state.toggleMedium);

  // Local state just for collapsing the filter panel
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="filters-panel glass-panel">
      {/* ── Panel Header (clickable to collapse) ────────────────────────── */}
      <button
        className="filters-header"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
      >
        <span>🔍 Filters</span>
        <span className={`filters-chevron ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {/* ── Collapsible Body ──────────────────────────────────────────────── */}
      {isOpen && (
        <div className="filters-body">

          {/* ── Era Section ─────────────────────────────────────────────── */}
          <div className="filter-section">
            <h4 className="filter-label">Era</h4>
            <div className="filter-buttons">
              {ERA_BUCKETS.map(bucket => {
                const isActive = filters.eras.includes(bucket.label);
                return (
                  <button
                    key={bucket.label}
                    className={`filter-btn ${isActive ? 'active' : ''}`}
                    onClick={() => toggleEra(bucket.label)}
                    title={`Toggle artworks from ${bucket.label}`}
                  >
                    {bucket.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Medium Section ───────────────────────────────────────────── */}
          <div className="filter-section">
            <h4 className="filter-label">Medium</h4>
            <div className="filter-buttons">
              {MEDIUMS.map(({ label, emoji }) => {
                const isActive = filters.mediums.includes(label);
                return (
                  <button
                    key={label}
                    className={`filter-btn ${isActive ? 'active' : ''}`}
                    onClick={() => toggleMedium(label)}
                    title={`Toggle ${label} artworks`}
                  >
                    {emoji} {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Reset All ────────────────────────────────────────────────── */}
          {(filters.eras.length > 0 || filters.mediums.length > 0) && (
            <button
              className="filter-reset"
              // Reset = toggle off all active filters individually
              onClick={() => {
                filters.eras.forEach(toggleEra);
                filters.mediums.forEach(toggleMedium);
              }}
            >
              ✕ Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
