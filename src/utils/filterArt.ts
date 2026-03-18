// src/utils/filterArt.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure filtering logic — given an array of ArtFeature and a set of active
// filters, returns only the artworks that should be visible.
//
// TEACHING CONCEPTS:
//  • Pure functions: same input → same output, no side effects
//  • Array.filter() chaining: apply each filter in sequence
//  • Early exit with "all" check: if nothing is toggled off, no filtering needed
// ─────────────────────────────────────────────────────────────────────────────

import type { ArtFeature, FilterState } from '../types/art';

// ── Era Bucket Definition ─────────────────────────────────────────────────────

/**
 * Each era bucket has a human-readable label and a [min, max] year range.
 * We use Infinity for the "no upper limit" case.
 *
 * TEACHING NOTE: This is called a "lookup table" or "constant map."
 * Instead of writing if/else chains everywhere, we define the rules once
 * and loop through them.
 */
export const ERA_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: 'Before 1900', min: 0,    max: 1899 },
  { label: '1900–1924',   min: 1900, max: 1924 },
  { label: '1925–1949',   min: 1925, max: 1949 },
  { label: '1950–1974',   min: 1950, max: 1974 },
  { label: '1975–1999',   min: 1975, max: 1999 },
  { label: '2000–Present',min: 2000, max: Infinity },
];

/** Returns the label of which era bucket a given year falls into. */
export function getEraBucket(year: number | null): string {
  if (year === null) return '2000–Present'; // Unknown year → default bucket
  const bucket = ERA_BUCKETS.find(b => year >= b.min && year <= b.max);
  return bucket?.label ?? '2000–Present';
}

// ── Main Filter Function ──────────────────────────────────────────────────────

/**
 * Filters ArtFeature[] according to the current filter state and search query.
 *
 * @param art       Full array of all loaded ArtFeature objects
 * @param filters   Active era and medium toggles from the Zustand store
 * @param search    Free-text search string (matches title or artist name)
 * @returns         Only the artworks that pass all active filters
 */
export function filterArt(
  art: ArtFeature[],
  filters: FilterState,
  search: string
): ArtFeature[] {
  // Normalize the search string once, outside the loop (performance tip)
  const query = search.trim().toLowerCase();

  return art.filter(piece => {
    // ── Era filter ────────────────────────────────────────────────────────────
    // If no era buttons are toggled, show everything (no filtering).
    // Otherwise, check if this piece's era bucket is in the active set.
    if (filters.eras.length > 0) {
      const bucket = getEraBucket(piece.year);
      if (!filters.eras.includes(bucket)) return false;
    }

    // ── Medium filter ─────────────────────────────────────────────────────────
    // Same logic as eras: no selection = show all, else must match.
    if (filters.mediums.length > 0) {
      if (!filters.mediums.includes(piece.medium)) return false;
    }

    // ── Search filter ─────────────────────────────────────────────────────────
    // If there's a search query, the piece title or artist name must include it.
    if (query) {
      const titleMatch  = piece.title.toLowerCase().includes(query);
      const artistMatch = piece.artistName.toLowerCase().includes(query);
      if (!titleMatch && !artistMatch) return false;
    }

    // Passed all filters!
    return true;
  });
}
