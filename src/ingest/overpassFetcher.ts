/**
 * Overpass (OSM) fetcher — types, pure functions, and CLI entry point.
 *
 * Run via: npm run osm:fetch [-- --area <slug>]
 */

import { OverpassElement, OverpassResponse } from './ports/IOsmApi';
import type { BusinessRecord } from '../domain/businessRecord';
import { postcodeDistrict } from '../domain/postcode';

// ── Pure helpers ───────────────────────────────────────────────────────────────

/**
 * Builds an Overpass QL query that fetches nodes, ways, and relations
 * matching any of the given OSM tag key=value pairs within a bounding circle.
 */
export function buildOverpassQuery(
  osmTags: string[],
  lat: number,
  lng: number,
  radiusM: number,
): string {
  const around = `(around:${radiusM},${lat},${lng})`;
  const filters = osmTags
    .map((tag) => {
      const [key, value] = tag.split('=');
      const selector = value ? `["${key}"="${value}"]` : `["${key}"]`;
      return (
        `node${selector}${around};\n` +
        `way${selector}${around};\n` +
        `relation${selector}${around};`
      );
    })
    .join('\n');

  return `[out:json][timeout:60];\n(\n${filters}\n);\nout center;`;
}

/**
 * Extracts coordinates from an Overpass element (node has lat/lon directly;
 * ways/relations use the center property).
 */
export function getElementCoords(
  el: OverpassElement,
): { lat: number | null; lng: number | null } {
  if (el.lat !== undefined && el.lon !== undefined) {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return { lat: null, lng: null };
}

/**
 * Maps a raw Overpass API response to an array of `BusinessRecord` objects.
 * Pure function — no I/O side effects. Skips elements with no name tag.
 */
export function parseOverpassResponse(
  response: OverpassResponse,
  fallbackPostcodeDistrict: string,
): BusinessRecord[] {
  if (!response.elements || response.elements.length === 0) {
    return [];
  }

  const records: BusinessRecord[] = [];

  for (const el of response.elements) {
    const name = el.tags?.name;
    if (!name) continue; // skip unnamed POIs

    const { lat, lng } = getElementCoords(el);
    const postcode = el.tags?.['addr:postcode'] ?? null;
    const houseNumber = el.tags?.['addr:housenumber'];
    const street = el.tags?.['addr:street'];
    const addressLine1 =
      houseNumber && street ? `${houseNumber} ${street}` : street ?? null;

    records.push({
      id: `osm:${el.type}:${el.id}`,
      companyNumber: null,
      name,
      status: 'active',
      sicCodes: [],
      addressLine1,
      postcode,
      locality: null,
      // OSM is fetched by a lat/lng radius, not a postcode filter — a POI
      // can genuinely sit in a different district than the one searched
      // for (e.g. Oldmixon/BS24 within radius of a BS23 centre).
      postcodeDistrict: postcodeDistrict(postcode) ?? fallbackPostcodeDistrict,
      lat,
      lng,
      source: 'osm',
    });
  }

  return records;
}

// ── CLI entry point ───────────────────────────────────────────────────────────

/* istanbul ignore next */
async function main(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const yaml = await import('js-yaml');
  const { OverpassApiAdapter } = await import('./adapters/overpassApiAdapter');
  const { OsmFetchService } = await import('./services/osmFetchService');
  const { writeRawRecords } = await import('./rawRecordsWriter');

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
  ) as { osm_tags: string[] };

  const osmApi = new OverpassApiAdapter();
  const service = new OsmFetchService(osmApi);
  const postcodeDistrict = area.postcode_districts[0];

  console.log(`Fetching OSM POIs for ${areaSlug}…`);
  const records = await service.fetchPois({
    areaSlug,
    postcodeDistrict,
    osmTags: placeTypesConfig.osm_tags,
    lat: area.centre.lat,
    lng: area.centre.lng,
    radiusM: area.search_radius_m,
    refresh,
  });

  writeRawRecords('osm', areaSlug, records);
  console.log(`Fetched ${records.length} OSM POIs for ${areaSlug}.`);
}

/* istanbul ignore next */
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
