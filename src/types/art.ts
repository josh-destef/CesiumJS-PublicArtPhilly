// src/types/art.ts
// ─────────────────────────────────────────────────────────────────────────────
// This file defines TWO layers of TypeScript types:
//
//  1. RawArt  – mirrors the exact shape of the philart.net JSON.
//               We keep this faithful to the API so students can compare
//               the type to the real data in art_data.json.
//
//  2. ArtFeature – our cleaned, internal representation.
//               All components and hooks use this type, never RawArt.
//               Transforming from RawArt → ArtFeature happens once, in
//               src/utils/transformData.ts.
// ─────────────────────────────────────────────────────────────────────────────

// ── Raw API Types ─────────────────────────────────────────────────────────────

/** A link object as returned by the API */
export interface RawLink {
  rel: string;
  href: string;
}

/** A picture entry with a small thumbnail and a large full-size image */
export interface RawPicture {
  small?: { url: string; mimetype: string };
  large?: { url: string; mimetype: string };
}

/** A content tag, e.g. { description: "abstract" } */
export interface RawContent {
  description: string;
  separator?: string;
  links?: RawLink[];
}

/** An exhibit entry — sometimes used to mark "Moved", "Missing", "Destroyed" */
export interface RawExhibit {
  name: string;
  links?: RawLink[];
}

/** An artist entry on the artwork */
export interface RawArtist {
  name: string;
  externallinks?: { url: string; label: string }[];
  links?: RawLink[];
}

/** A year entry on the artwork */
export interface RawYear {
  year: string;
  links?: RawLink[];
}

/**
 * A single artwork record exactly as it appears in art_data.json.
 * All fields are optional (except links) because the API is inconsistent.
 */
export interface RawArt {
  links: RawLink[];                 // First href contains the artwork's unique ID
  title?: { display?: string; list?: string };
  artists?: RawArtist[];
  years?: RawYear[];
  location?: {
    latitude?: string;
    longitude?: string;
    description?: string;
  };
  comments?: string;
  artist_comments?: string;         // Alternate comments field used for status
  content?: RawContent[];           // Tags like "abstract", "mural", "fountain"
  pictures?: RawPicture[];
  exhibits?: RawExhibit[];          // May contain "Moved", "Missing", "Destroyed"
}

/** The top-level structure of art_data.json */
export interface RawApiResponse {
  body: {
    art: RawArt[];
  };
}

// ── Internal App Types ────────────────────────────────────────────────────────

/**
 * The five broad medium categories we classify art into.
 * "Other" is the catch-all when no content tags match.
 */
export type ArtMedium = 'Sculpture' | 'Mural' | 'Monument' | 'Fountain' | 'Other';

/**
 * ArtFeature is the clean, processed version of a single artwork.
 * Every component in the app works with this type.
 */
export interface ArtFeature {
  /** Unique string ID extracted from the API self-link, e.g. "75" */
  id: string;

  /** Human-readable title, e.g. "Clothespin" */
  title: string;

  /** Artist name(s) joined by " & " — or "Unknown" if missing */
  artistName: string;

  /** WGS-84 latitude (decimal degrees) */
  lat: number;

  /** WGS-84 longitude (decimal degrees) */
  lon: number;

  /** The year the artwork was created (number), or null if unknown */
  year: number | null;

  /** Broad medium category derived from content tags */
  medium: ArtMedium;

  /** URL of the small thumbnail image — used in the gallery ribbon */
  thumbnailUrl: string | null;

  /** URL of the large photo — used in the detail popup */
  largeUrl: string | null;

  /**
   * True if the artwork has been Moved, is Missing, or was Destroyed.
   * Absent pieces get a greyed-out marker on the globe.
   */
  isAbsent: boolean;

  /** Human-readable location description, e.g. "South side of Market at 15th" */
  locationDesc: string;

  /** Free-text comments from the API */
  comments: string;
}

/** The filter state managed by Zustand */
export interface FilterState {
  /** Active era bucket labels, e.g. ["1950–1974", "1975–1999"] */
  eras: string[];
  /** Active medium labels, e.g. ["Sculpture", "Mural"] */
  mediums: string[];
}
