/**
 * Companies House ingest — pure parser + CLI entry point.
 *
 * Run via: npm run companies:fetch [-- --area <slug>]
 */

export type { CompanyItem, CompaniesHouseSearchResponse } from './ports/ICompaniesHouseApi';
export type { BusinessRecord } from '../domain/businessRecord';

import type { CompaniesHouseSearchResponse } from './ports/ICompaniesHouseApi';
import type { BusinessRecord } from '../domain/businessRecord';

/**
 * Maps a Companies House search response to BusinessRecord objects.
 * Pure function — no I/O side effects.
 *
 * Companies with no name are skipped (name is required downstream).
 */
export function parseCompaniesToBusinessRecords(
  response: CompaniesHouseSearchResponse,
  postcodeDistrict: string,
): BusinessRecord[] {
  if (!response.items || response.items.length === 0) {
    return [];
  }

  const records: BusinessRecord[] = [];

  for (const company of response.items) {
    if (!company.company_name) {
      continue;
    }

    records.push({
      id: `companies_house:${company.company_number}`,
      companyNumber: company.company_number,
      name: company.company_name,
      status: company.company_status,
      sicCodes: company.sic_codes ?? [],
      addressLine1: company.registered_office_address?.address_line_1 ?? null,
      postcode: company.registered_office_address?.postal_code ?? null,
      locality: company.registered_office_address?.locality ?? null,
      postcodeDistrict,
      lat: null,
      lng: null,
      source: 'companies_house',
    });
  }

  return records;
}

/* istanbul ignore next */
async function main(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const yaml = await import('js-yaml');
  const { CompaniesHouseApiAdapter } = await import('./adapters/companiesHouseApiAdapter');
  const { CompaniesHouseFetchService } = await import('./services/companiesHouseFetchService');
  const { writeRawRecords } = await import('./rawRecordsWriter');

  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    console.error('COMPANIES_HOUSE_API_KEY is not set.');
    process.exit(1);
  }

  const areasConfig = yaml.load(
    fs.readFileSync(path.join(process.cwd(), 'config', 'areas.yaml'), 'utf-8'),
  ) as { areas: Record<string, { postcode_districts: string[] }> };

  const areaArgIndex = process.argv.indexOf('--area');
  const areaSlug = areaArgIndex >= 0 ? process.argv[areaArgIndex + 1] : 'weston-super-mare';
  const area = areasConfig.areas[areaSlug];
  if (!area) {
    console.error(`Unknown area: ${areaSlug}`);
    process.exit(1);
  }

  const refresh = process.argv.includes('--refresh');
  const service = new CompaniesHouseFetchService(new CompaniesHouseApiAdapter());
  const records: BusinessRecord[] = [];

  for (const postcodeDistrict of area.postcode_districts) {
    for (const status of ['active', 'dissolved'] as const) {
      console.log(`Fetching Companies House data: ${postcodeDistrict} / ${status}…`);
      records.push(...await service.fetchDistrict({ postcodeDistrict, status, apiKey, refresh }));
    }
  }

  writeRawRecords('companies_house', areaSlug, records);
  console.log(`Fetched ${records.length} companies for ${areaSlug}.`);
}

/* istanbul ignore next */
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
