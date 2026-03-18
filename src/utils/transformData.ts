// src/utils/transformData.ts
// ─────────────────────────────────────────────────────────────────────────────
// This utility converts the raw philart.net JSON into our clean ArtFeature
// objects. Every piece of data-wrangling logic lives here so the rest of the
// app never has to touch the raw API format.
//
// KEY TEACHING CONCEPTS:
//  • Data normalization — one transformation pass, clean types everywhere else
//  • Defensive coding — every field is optional in the raw data; we handle nulls
//  • Pure functions — no side-effects, easy to unit-test
// ─────────────────────────────────────────────────────────────────────────────

import type { RawArt, ArtFeature, ArtMedium } from '../types/art';

// ── Medium Classification ─────────────────────────────────────────────────────

/**
 * Maps content description keywords to our five broad medium categories.
 * The first matching rule wins, so order matters — more specific rules go first.
 *
 * TEACHING NOTE: This is a "lookup table" or "classification function."
 * We use content tags from the API (like "mural", "abstract") to decide
 * which category each artwork belongs to.
 */
function classifyMedium(contentDescriptions: string[]): ArtMedium {
  // Normalize to lowercase so the match is case-insensitive
  const tags = contentDescriptions.map(d => d.toLowerCase());

  // Check each category in priority order
  if (tags.some(t => t.includes('mural') || t.includes('mosaic') || t.includes('tile') || t.includes('fresco'))) {
    return 'Mural';
  }
  if (tags.some(t => t.includes('fountain') || t.includes('water'))) {
    return 'Fountain';
  }
  if (tags.some(t =>
    t.includes('monument') || t.includes('memorial') || t.includes('relief') ||
    t.includes('plaque') || t.includes('marker')
  )) {
    return 'Monument';
  }
  if (tags.some(t =>
    t.includes('abstract') || t.includes('standing') || t.includes('figurative') ||
    t.includes('sculpture') || t.includes('statue') || t.includes('people') ||
    t.includes('person')
  )) {
    return 'Sculpture';
  }

  return 'Other';
}

// ── Status Detection ──────────────────────────────────────────────────────────

/**
 * Determines if an artwork is absent (Moved / Missing / Destroyed).
 *
 * TEACHING NOTE: The philart.net API marks these in the `exhibits` array.
 * For example, an artwork might have exhibits: [{ name: "Moved" }].
 * We also check the text in `comments` and `artist_comments` as a backup.
 */
function detectAbsence(raw: RawArt): boolean {
  const absentKeywords = ['moved', 'missing', 'destroyed', 'removed', 'lost'];

  // Primary check: exhibits array
  const exhibitNames = (raw.exhibits ?? []).map(e => e.name.toLowerCase());
  if (exhibitNames.some(name => absentKeywords.some(kw => name.includes(kw)))) {
    return true;
  }

  // Fallback check: comments text
  const allComments = [raw.comments ?? '', raw.artist_comments ?? ''].join(' ').toLowerCase();
  return absentKeywords.some(kw => allComments.includes(kw));
}

// ── ID Extraction ─────────────────────────────────────────────────────────────

/**
 * Extracts a unique numeric ID from the artwork's self-link URL.
 * Example: "https://www.philart.net/api/art/75.json" → "75"
 *
 * TEACHING NOTE: We often need to derive an ID from a URL path.
 * The pattern here is: split by "/", take the last segment, remove ".json".
 */
function extractId(raw: RawArt): string {
  const selfLink = raw.links?.find(l => l.rel === 'self')?.href ?? '';
  const parts = selfLink.split('/');
  return parts[parts.length - 1]?.replace('.json', '') ?? Math.random().toString(36).slice(2);
}

// ── Main Transformer ──────────────────────────────────────────────────────────

/**
 * Transforms a single RawArt record into our clean ArtFeature type.
 * Returns null if the artwork has no valid coordinates (we can't place it).
 */
function transformOne(raw: RawArt): ArtFeature | null {
  // Parse coordinates — they come as strings in the API
  const lat = parseFloat(raw.location?.latitude ?? '');
  const lon = parseFloat(raw.location?.longitude ?? '');

  // Skip artwork with invalid or missing coordinates
  if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) {
    return null;
  }

  // Collect all content tag descriptions for medium classification
  const contentTags = (raw.content ?? []).map(c => c.description);

  // Extract first artist name (join multiple artists with " & ")
  const artistName = raw.artists?.map(a => a.name).join(' & ') || 'Unknown Artist';

  // Parse year — the years array can have multiple; take the first
  const yearStr = raw.years?.[0]?.year;
  const year = yearStr ? parseInt(yearStr, 10) : null;

  // Extract image URLs — the first picture entry is the primary one
  const firstPicture = raw.pictures?.[0];
  const thumbnailUrl = firstPicture?.small?.url ?? null;
  const largeUrl = firstPicture?.large?.url ?? null;

  return {
    id: extractId(raw),
    title: raw.title?.display ?? raw.title?.list ?? 'Untitled',
    artistName,
    lat,
    lon,
    year,
    medium: classifyMedium(contentTags),
    thumbnailUrl,
    largeUrl,
    isAbsent: detectAbsence(raw),
    locationDesc: raw.location?.description ?? '',
    comments: raw.comments ?? raw.artist_comments ?? '',
  };
}

/**
 * Transforms the full raw art array into ArtFeature[].
 * Invalid entries (no coordinates, parse failures) are silently filtered out.
 *
 * TEACHING NOTE: The `.filter(Boolean)` pattern removes nulls from the array.
 * TypeScript's "type predicate" (f is ArtFeature) tells the compiler the
 * resulting array contains only non-null values.
 */
export function transformArtData(rawArt: RawArt[]): ArtFeature[] {
  return rawArt
    .map(transformOne)
    .filter((f): f is ArtFeature => f !== null);
}
