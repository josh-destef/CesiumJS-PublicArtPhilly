// src/components/ui/Gallery.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The horizontal scrollable thumbnail ribbon at the bottom of the screen.
// Shows all currently-filtered artworks as clickable thumbnail cards.
//
// TEACHING CONCEPTS:
//  • Scrollable container with overflow-x: auto
//  • Clicking a card selects the art AND triggers a fly-to via a callback
//  • The `onFlyTo` callback is passed down from App.tsx (which holds the viewer)
//  • "Surprise Me" button picks a random entry from the *filtered* dataset
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react';
import type { ArtFeature } from '../../types/art';
import { useAppStore } from '../../store/useAppStore';

interface GalleryProps {
  /** The currently-visible (filtered) artworks to show in the ribbon */
  filteredArt: ArtFeature[];
  /** Callback to fly the camera to a given artwork */
  onFlyTo: (art: ArtFeature) => void;
}

export default function Gallery({ filteredArt, onFlyTo }: GalleryProps) {
  const selectedArtId = useAppStore(state => state.selectedArtId);
  const selectArt     = useAppStore(state => state.selectArt);

  // Reference to the scroll container so we can programmatically scroll
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Handle clicking a gallery card:
   * 1. Update the global selected ID
   * 2. Fly the camera to the piece
   */
  function handleCardClick(art: ArtFeature) {
    selectArt(art.id);
    onFlyTo(art);
  }

  /**
   * "Surprise Me" — picks a random artwork from the filtered set.
   * TEACHING NOTE: Math.random() returns a number from 0 (inclusive) to 1 (exclusive).
   * Multiplying by the array length and using Math.floor() converts it to a valid index.
   */
  function handleSurpriseMe() {
    if (filteredArt.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredArt.length);
    const randomArt   = filteredArt[randomIndex];
    selectArt(randomArt.id);
    onFlyTo(randomArt);
  }

  return (
    <div className="gallery-wrapper">
      {/* ── Gallery Header ─────────────────────────────────────────────────── */}
      <div className="gallery-header">
        <span className="gallery-count">
          {filteredArt.length.toLocaleString()} artwork{filteredArt.length !== 1 ? 's' : ''}
        </span>
        <button
          className="btn-surprise"
          onClick={handleSurpriseMe}
          title="Select a random artwork"
          id="surprise-me-btn"
        >
          🎲 Surprise Me
        </button>
      </div>

      {/* ── Scrollable Ribbon ──────────────────────────────────────────────── */}
      <div className="gallery-scroll" ref={scrollRef}>
        {filteredArt.map(art => (
          <button
            key={art.id}
            className={`gallery-card ${selectedArtId === art.id ? 'selected' : ''}`}
            onClick={() => handleCardClick(art)}
            title={`${art.title} — ${art.artistName}`}
          >
            {/* Thumbnail image (or placeholder if no image exists) */}
            {art.thumbnailUrl ? (
              <img
                className="gallery-thumb"
                src={art.thumbnailUrl}
                alt={art.title}
                loading="lazy" // Browser only loads this image when it's near the viewport
                onError={e => {
                  // If the image fails to load, show a grey placeholder
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="gallery-thumb-placeholder">🖼️</div>
            )}

            {/* Artwork info below the thumbnail */}
            <div className="gallery-card-info">
              <span className="gallery-card-title">{art.title}</span>
              {art.year && <span className="gallery-card-year">{art.year}</span>}
            </div>

            {/* Badge for absent artworks */}
            {art.isAbsent && <span className="gallery-absent-badge">Moved</span>}
          </button>
        ))}

        {/* Empty state */}
        {filteredArt.length === 0 && (
          <div className="gallery-empty">No artworks match your current filters.</div>
        )}
      </div>
    </div>
  );
}
