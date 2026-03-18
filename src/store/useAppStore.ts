// src/store/useAppStore.ts
// ─────────────────────────────────────────────────────────────────────────────
// Global application state managed by Zustand.
//
// TEACHING CONCEPTS:
//  • Zustand is a lightweight state management library — simpler than Redux.
//  • The store is a single hook (useAppStore) that any component can import.
//  • Only components that READ a piece of state re-render when IT changes.
//    E.g., the Popup reads selectedArtId, so only it re-renders on selection.
//
// HOW ZUSTAND WORKS:
//  create((set) => ({
//    value: initialValue,
//    updateValue: (newVal) => set({ value: newVal }),
//  }))
//  → `set` merges the new properties into the existing state object.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { FilterState } from '../types/art';

// ── Store Shape ───────────────────────────────────────────────────────────────

interface AppState {
  /** The ID of the artwork currently selected and shown in the Popup. null = nothing selected. */
  selectedArtId: string | null;

  /** Active filters — which era buckets and mediums the user has toggled ON. */
  filters: FilterState;

  /** Current text in the search box. Empty string = no search active. */
  searchQuery: string;

  // ── Actions (functions that update state) ────────────────────────────────────

  /** Select an artwork by its ID (or deselect by passing null) */
  selectArt: (id: string | null) => void;

  /**
   * Toggle a specific era bucket on/off.
   * If the era is already active, remove it. If not, add it.
   */
  toggleEra: (era: string) => void;

  /**
   * Toggle a specific medium on/off.
   * Works the same way as toggleEra.
   */
  toggleMedium: (medium: string) => void;

  /** Update the live search query */
  setSearch: (query: string) => void;
}

// ── Store Implementation ──────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  // ── Initial State ──────────────────────────────────────────────────────────
  selectedArtId: null,
  filters: {
    eras: [],      // Empty = "show all eras"
    mediums: [],   // Empty = "show all mediums"
  },
  searchQuery: '',

  // ── Actions ───────────────────────────────────────────────────────────────

  selectArt: (id) => set({ selectedArtId: id }),

  toggleEra: (era) =>
    set((state) => {
      const hasEra = state.filters.eras.includes(era);
      return {
        filters: {
          ...state.filters,
          // If era is active → remove it. If not → add it.
          eras: hasEra
            ? state.filters.eras.filter(e => e !== era)
            : [...state.filters.eras, era],
        },
      };
    }),

  toggleMedium: (medium) =>
    set((state) => {
      const hasMedium = state.filters.mediums.includes(medium);
      return {
        filters: {
          ...state.filters,
          mediums: hasMedium
            ? state.filters.mediums.filter(m => m !== medium)
            : [...state.filters.mediums, medium],
        },
      };
    }),

  setSearch: (query) => set({ searchQuery: query }),
}));
