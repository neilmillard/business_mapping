/**
 * Google Places API fetcher — types, pure functions, and CLI entry point.
 *
 * Run via: npm run places:fetch [-- --area <slug>]
 * Defaults to weston-super-mare (config/areas.yaml) if not specified.
 */

import type { BusinessRecord } from '../domain/businessRecord';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlacesResult {
  id: string;
  displayName: { text: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  businessStatus?: string;
  types?: string[];
}

export interface PlacesResponse {
  places?: PlacesResult[];
}

// ── Pure response parser ───────────────────────────────────────────────────────

/**
 * Maps a raw Places API response to an array of `BusinessRecord` objects.
 * Pure function — no I/O side effects.
 */
export function parsePlacesResponse(
  response: PlacesResponse,
  postcodeDistrict: string,
): BusinessRecord[] {
  if (!response.places || response.places.length === 0) {
    return [];
  }

  return response.places.map((place) => {
    const businessStatus = place.businessStatus ?? 'UNKNOWN';
    const status =
      businessStatus === 'OPERATIONAL' ? 'active' :
      businessStatus === 'CLOSED_PERMANENTLY' || businessStatus === 'CLOSED_TEMPORARILY' ? 'closed' :
      'unknown';

    return {
      id: `google_places:${place.id}`,
      companyNumber: null,
      name: place.displayName.text,
      status,
      sicCodes: [],
      addressLine1: place.formattedAddress ?? null,
      postcode: null,
      locality: null,
      postcodeDistrict,
      lat: place.location?.latitude ?? null,
      lng: place.location?.longitude ?? null,
      source: 'google_places',
    };
  });
}

// ── CLI entry point ───────────────────────────────────────────────────────────

/* istanbul ignore next */
async function main(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const yaml = await import('js-yaml');
  const { GooglePlacesApiAdapter } = await import('./adapters/googlePlacesApiAdapter');
  const { PlacesFetchService } = await import('./services/placesFetchService');
  const { writeRawRecords } = await import('./rawRecordsWriter');

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY is not set.');
    process.exit(1);
  }

  const refresh = process.argv.includes('--refresh');
  const areaArgIndex = process.argv.indexOf('--area');
  const areaSlug = areaArgIndex >= 0 ? process.argv[areaArgIndex + 1] : 'weston-super-mare';

  const areasConfig = yaml.load(
    fs.readFileSync(path.join(process.cwd(), 'config', 'areas.yaml'), 'utf-8'),
  ) as { areas: Record<string, { postcode_districts: string[]; centre?: { lat: number; lng: number }; search_radius_m?: number }> };
  const area = areasConfig.areas[areaSlug];
  if (!area?.centre || !area.search_radius_m) {
    console.error(`Area "${areaSlug}" is missing centre/search_radius_m in config/areas.yaml.`);
    process.exit(1);
  }

  const placeTypesConfig = yaml.load(
    fs.readFileSync(path.join(process.cwd(), 'config', 'place_types.yaml'), 'utf-8'),
  ) as { google_places_types: string[] };

  const placesApi = new GooglePlacesApiAdapter();
  const service = new PlacesFetchService(placesApi);
  const postcodeDistrict = area.postcode_districts[0];
  const records: BusinessRecord[] = [];

  for (const placeType of placeTypesConfig.google_places_types) {
    console.log(`Fetching Google Places: ${placeType} for ${areaSlug}…`);
    records.push(...await service.fetchPlaceType({
      placeType,
      lat: area.centre.lat,
      lng: area.centre.lng,
      radiusM: area.search_radius_m,
      apiKey,
      areaSlug,
      postcodeDistrict,
      refresh,
    }));
  }

  writeRawRecords('google_places', areaSlug, records);
  console.log(`Fetched ${records.length} places for ${areaSlug}.`);
}

/* istanbul ignore next */
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
