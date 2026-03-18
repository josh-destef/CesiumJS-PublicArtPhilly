// src/components/ui/Popup.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The detail panel that slides in from the right when an artwork is selected.
// Shows the large photo, title, artist, year, location, and comments.
//
// TEACHING CONCEPTS:
//  • Conditional rendering: the panel only shows when selectedArtId is set
//  • CSS slide-in animation controlled by a class name
//  • The "Fly to Art" action reads the viewer from a callback prop (not state)
// ─────────────────────────────────────────────────────────────────────────────

import type { ArtFeature } from '../../types/art';
import { useAppStore } from '../../store/useAppStore';

interface PopupProps {
  /** The full list of art (needed to look up the selected piece by ID) */
  allArt: ArtFeature[];
  /** Callback to fly the camera to the selected artwork */
  onFlyTo: (art: ArtFeature) => void;
}

export default function Popup({ allArt, onFlyTo }: PopupProps) {
  const selectedArtId = useAppStore(state => state.selectedArtId);
  const selectArt     = useAppStore(state => state.selectArt);

  // Find the selected artwork from the full list using its ID
  // Array.find() returns undefined if no match — safe to handle below
  const art = allArt.find(a => a.id === selectedArtId);

  // If nothing is selected, don't render the popup at all
  if (!art) return null;

  return (
    <div className="popup-panel glass-panel">
      {/* ── Close Button ──────────────────────────────────────────────────── */}
      <button
        className="popup-close"
        onClick={() => selectArt(null)}
        aria-label="Close details panel"
        id="popup-close-btn"
      >
        ✕
      </button>

      {/* ── Large Image ───────────────────────────────────────────────────── */}
      {art.largeUrl ? (
        <div className="popup-image-wrapper">
          <img
            className="popup-image"
            src={art.largeUrl}
            alt={art.title}
            onError={e => {
              // Fall back to thumbnail if large image fails
              if (art.thumbnailUrl) {
                (e.target as HTMLImageElement).src = art.thumbnailUrl;
              } else {
                (e.target as HTMLImageElement).style.display = 'none';
              }
            }}
          />
          {/* Absent overlay */}
          {art.isAbsent && (
            <div className="popup-absent-overlay">
              ⚠️ This artwork has been moved, is missing, or was destroyed.
            </div>
          )}
        </div>
      ) : (
        <div className="popup-no-image">No image available</div>
      )}

      {/* ── Artwork Info ──────────────────────────────────────────────────── */}
      <div className="popup-body">
        <h2 className="popup-title">{art.title}</h2>

        <div className="popup-meta">
          <span className="popup-artist">🎨 {art.artistName}</span>
          {art.year && <span className="popup-year">📅 {art.year}</span>}
          <span className="popup-medium">{getMediumEmoji(art.medium)} {art.medium}</span>
        </div>

        {art.locationDesc && (
          <div className="popup-location">
            📍 {art.locationDesc}
          </div>
        )}

        {art.comments && (
          <p
            className="popup-comments"
            // The API uses HTML tags like <I> in comments — safe to render
            dangerouslySetInnerHTML={{ __html: art.comments }}
          />
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <button
          className="btn-flyto"
          onClick={() => onFlyTo(art)}
          id="fly-to-art-btn"
        >
          🚁 Fly to Art
        </button>
      </div>
    </div>
  );
}

/** Returns an emoji for a given medium category */
function getMediumEmoji(medium: string): string {
  const map: Record<string, string> = {
    Sculpture: '🗿',
    Mural:     '🎨',
    Monument:  '🏛️',
    Fountain:  '💧',
    Other:     '✨',
  };
  return map[medium] ?? '✨';
}
