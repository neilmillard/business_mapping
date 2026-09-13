/**
 * dedupe — cross-source fuzzy matching of BusinessRecords by name + location.
 *
 * Ported from townscan's supplyCensus dedup logic, adapted to merge SIC
 * codes across duplicates instead of discarding the losing record outright
 * (Companies House is often the only source with a SIC code for a business
 * that Google Places / OSM also see).
 */

import type { BusinessRecord } from '../domain/businessRecord';

const SOURCE_PRIORITY: Record<BusinessRecord['source'], number> = {
  google_places: 1,
  osm: 2,
  companies_house: 3,
};

/**
 * Normalises a business name for fuzzy matching: lowercases, removes
 * common stop words (the/a/an), strips punctuation, and collapses whitespace.
 */
export function normaliseBusinessName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/'/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0 && !['the', 'a', 'an'].includes(word))
    .join(' ')
    .trim();
}

/**
 * Calculates the great-circle distance in metres between two lat/lng points
 * using the Haversine formula. Returns null if any coordinate is null.
 */
export function haversineDistanceM(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null,
): number | null {
  if (lat1 === null || lng1 === null || lat2 === null || lng2 === null) {
    return null;
  }

  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determines whether two records represent the same physical business.
 *
 * They are duplicates if:
 *   - Same ID (exact match), OR
 *   - Normalised names match AND distance is < 100m, OR
 *   - Normalised names match AND both have null coords (name-only fallback)
 */
export function areDuplicates(a: BusinessRecord, b: BusinessRecord): boolean {
  if (a.id === b.id) return true;

  const nameA = normaliseBusinessName(a.name);
  const nameB = normaliseBusinessName(b.name);
  if (nameA !== nameB) return false;

  const dist = haversineDistanceM(a.lat, a.lng, b.lat, b.lng);
  if (dist === null) return true;

  return dist < 100;
}

/** Merges SIC codes from two records, deduping while preserving order. */
export function mergeSicCodes(a: BusinessRecord, b: BusinessRecord): string[] {
  return [...new Set([...a.sicCodes, ...b.sicCodes])];
}

/**
 * Deduplicates a list of business records using fuzzy name + location matching.
 *
 * When duplicates are found, keeps the highest-priority source
 * (google_places > osm > companies_house) but merges SIC codes from all
 * matched duplicates into the kept record.
 *
 * O(n²) — acceptable for a town-level business census (< 10K businesses).
 */
export function deduplicateBusinesses(businesses: BusinessRecord[]): BusinessRecord[] {
  if (businesses.length === 0) return [];

  const sorted = [...businesses].sort(
    (a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source],
  );

  const kept: BusinessRecord[] = [];

  for (const candidate of sorted) {
    const existingIndex = kept.findIndex((existing) => areDuplicates(existing, candidate));
    if (existingIndex === -1) {
      kept.push(candidate);
    } else {
      kept[existingIndex] = {
        ...kept[existingIndex],
        sicCodes: mergeSicCodes(kept[existingIndex], candidate),
      };
    }
  }

  return kept;
}
