// src/App.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The root component that wires everything together:
//  - Fetches art data via React Query
//  - Transforms raw data to ArtFeature[]
//  - Computes filtered subset from Zustand state
//  - Renders the CesiumGlobe + all UI overlays
//  - Provides the flyTo function to child components
//
// LAYOUT (CSS uses absolute positioning):
//   ┌─────────────────────────────────┐
//   │  [Search]         [Filters]     │  ← top bar
//   │                                 │
//   │        Globe (fullscreen)       │
//   │                                 │
//   │                     [Popup]     │  ← right panel
//   │─────────────────────────────────│
//   │  [Gallery ribbon]               │  ← bottom
//   └─────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Cesium from 'cesium';

import CesiumGlobe from './components/globe/CesiumGlobe';
import Search      from './components/ui/Search';
import Filters     from './components/ui/Filters';
import Gallery     from './components/ui/Gallery';
import Popup       from './components/ui/Popup';

import { useCesiumEntities } from './hooks/useCesiumEntities';
import { transformArtData }  from './utils/transformData';
import { filterArt }         from './utils/filterArt';
import { useAppStore }       from './store/useAppStore';
import type { RawApiResponse, ArtFeature } from './types/art';

export default function App() {
  // ── Viewer Ref ────────────────────────────────────────────────────────────
  // We store the Cesium Viewer in a ref (not state) because:
  //  - We need it to persist across renders
  //  - Changing the viewer should NOT trigger a React re-render
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);

  // Called by CesiumGlobe once its viewer is initialized
  const handleViewerReady = useCallback((v: Cesium.Viewer) => {
    setViewer(v);
  }, []);

  // ── Data Fetching via React Query ─────────────────────────────────────────
  // useQuery handles loading, error, caching, and stale-time automatically.
  // TEACHING NOTE: The 'queryKey' is a unique label for this query.
  //   If multiple components call useQuery with the same key, React Query
  //   only fetches ONCE and shares the result — no duplicate network calls!
  const { data: rawData, isLoading, error } = useQuery<RawApiResponse>({
    queryKey: ['artData'],
    queryFn: async () => {
      // Fetch the JSON file from the /public folder (served by Vite dev server)
      const response = await fetch('/art_data.json');
      if (!response.ok) throw new Error('Failed to load art_data.json');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes — no re-fetch needed
  });

  // ── Data Transformation ───────────────────────────────────────────────────
  // useMemo only re-runs the expensive transform when rawData changes.
  // TEACHING NOTE: transforming 1000+ records on every render would be slow.
  //   useMemo caches the result until its dependencies ([rawData]) change.
  const allArt: ArtFeature[] = useMemo(() => {
    if (!rawData?.body?.art) return [];
    return transformArtData(rawData.body.art);
  }, [rawData]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  // Read filter state from Zustand store
  const filters     = useAppStore(state => state.filters);
  const searchQuery = useAppStore(state => state.searchQuery);

  // Compute the filtered subset — also memoized
  const filteredArt = useMemo(
    () => filterArt(allArt, filters, searchQuery),
    [allArt, filters, searchQuery]
  );

  // Build a Set of filtered IDs for O(1) membership checks in the hook
  const filteredIds = useMemo(
    () => new Set(filteredArt.map(a => a.id)),
    [filteredArt]
  );

  // ── Connect Art Data to the Globe ─────────────────────────────────────────
  // This custom hook manages all CesiumJS Entity creation and visibility.
  useCesiumEntities({ viewer, artFeatures: allArt, filteredIds });

  // ── Fly-To Function ───────────────────────────────────────────────────────
  /**
   * Animates the camera to a specific artwork.
   * Uses a 200m altitude and 45° downward pitch for a "drone view" effect.
   *
   * TEACHING NOTE: Cesium uses radians for angles, not degrees.
   * Cesium.Math.toRadians(45) converts 45° to ~0.785 radians.
   */
  const flyToArt = useCallback((art: ArtFeature) => {
    if (!viewer) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        art.lon,
        art.lat,
        300 // meters above the ground
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch:   Cesium.Math.toRadians(-45), // 45° down (drone view)
        roll:    0,
      },
      duration: 2.5, // seconds — smooth cinematic flight
    });
  }, [viewer]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      {/* ── Globe: full-screen background ────────────────────────────────── */}
      <div className="globe-container">
        <CesiumGlobe onViewerReady={handleViewerReady} />
      </div>

      {/* ── Top Bar: Search + Filters ────────────────────────────────────── */}
      <header className="top-bar">
        <div className="app-title">
          <span className="title-icon">🏙️</span>
          <h1>Philly Public Art</h1>
        </div>
        <Search />
        <Filters />
      </header>

      {/* ── Loading State ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Loading artwork data…</p>
        </div>
      )}

      {/* ── Error State ───────────────────────────────────────────────────── */}
      {error && (
        <div className="error-banner">
          ⚠️ Could not load art data: {(error as Error).message}
        </div>
      )}

      {/* ── Art Detail Popup (right panel) ────────────────────────────────── */}
      <Popup allArt={allArt} onFlyTo={flyToArt} />

      {/* ── Bottom Gallery Ribbon ─────────────────────────────────────────── */}
      <Gallery filteredArt={filteredArt} onFlyTo={flyToArt} />
    </div>
  );
}
