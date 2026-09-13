/**
 * census:build — merges parsed BusinessRecords from every ingest source,
 * dedupes them, and writes the result to reports/census_<area>.csv.
 *
 * Run via: npm run census:build [-- --area <slug>]
 */

import { deduplicateBusinesses } from './dedupe';
import type { BusinessRecord } from '../domain/businessRecord';

export interface CensusSources {
  companiesHouse: BusinessRecord[];
  googlePlaces: BusinessRecord[];
  osm: BusinessRecord[];
}

/**
 * Merges every source's records and dedupes them into a single sorted
 * business list. Pure function — no I/O.
 */
export function buildBusinessCensus(sources: CensusSources): BusinessRecord[] {
  const merged = [...sources.companiesHouse, ...sources.googlePlaces, ...sources.osm];
  const deduped = deduplicateBusinesses(merged);
  return deduped.sort((a, b) => a.name.localeCompare(b.name));
}

// ── CLI entry point ───────────────────────────────────────────────────────────

/* istanbul ignore next */
async function main(): Promise<void> {
  const path = await import('path');
  const { readRawRecords } = await import('../ingest/rawRecordsWriter');
  const { writeBusinessCsv } = await import('./csvBusinessWriter');

  const areaArgIndex = process.argv.indexOf('--area');
  const areaSlug = areaArgIndex >= 0 ? process.argv[areaArgIndex + 1] : 'weston-super-mare';

  const census = buildBusinessCensus({
    companiesHouse: readRawRecords('companies_house', areaSlug),
    googlePlaces: readRawRecords('google_places', areaSlug),
    osm: readRawRecords('osm', areaSlug),
  });

  const outPath = path.join(process.cwd(), 'reports', `census_${areaSlug}.csv`);
  writeBusinessCsv(census, outPath);

  console.log(`Wrote ${census.length} deduped businesses to ${outPath}`);
}

/* istanbul ignore next */
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
