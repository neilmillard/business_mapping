/**
 * postcode — pure helpers for pulling a UK postcode (and its outward
 * district code) out of free-text addresses.
 *
 * Needed because Google Places' formattedAddress and OSM's addr:postcode
 * tag are the only place a business's real postcode shows up — without
 * this, every geo-fetched record was mislabelled with the search area's
 * first configured postcode district regardless of where it actually sits.
 */

const POSTCODE_REGEX = /([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})/i;

/** Extracts and normalises (upper-cased, single-spaced) a UK postcode from free text. */
export function extractPostcode(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(POSTCODE_REGEX);
  if (!match) return null;
  return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
}

/** Returns the outward code (postcode district), e.g. "BS24" from "BS24 9AW". */
export function postcodeDistrict(postcode: string | null): string | null {
  if (!postcode) return null;
  const match = postcode.match(POSTCODE_REGEX);
  if (!match) return null;
  return match[1].toUpperCase();
}
