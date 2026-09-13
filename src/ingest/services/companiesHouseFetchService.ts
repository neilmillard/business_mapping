/**
 * CompaniesHouseFetchService — domain service (hexagonal core).
 *
 * Orchestrates paginated calls to ICompaniesHouseApi and parses each page
 * into BusinessRecords via the pure parser. Knows nothing about HTTP,
 * caching, or the file system.
 */

import { parseCompaniesToBusinessRecords } from '../companiesHouseFetcher';
import { ICompaniesHouseApi } from '../ports/ICompaniesHouseApi';
import type { BusinessRecord } from '../../domain/businessRecord';

export interface FetchDistrictOptions {
  postcodeDistrict: string;
  status: 'active' | 'dissolved';
  apiKey: string;
  refresh: boolean;
}

export class CompaniesHouseFetchService {
  constructor(private readonly api: ICompaniesHouseApi) {}

  /**
   * Fetches every page of companies for a postcode district and status,
   * following pagination until all `total_results` have been retrieved.
   */
  async fetchDistrict(opts: FetchDistrictOptions): Promise<BusinessRecord[]> {
    const { postcodeDistrict, status, apiKey, refresh } = opts;

    const records: BusinessRecord[] = [];
    let startIndex = 0;
    let totalResults = 0;

    do {
      const response = await this.api.searchCompanies({
        postcodeDistrict,
        status,
        apiKey,
        refresh,
        startIndex,
      });

      records.push(...parseCompaniesToBusinessRecords(response, postcodeDistrict));

      totalResults = response.total_results ?? 0;
      startIndex += response.items?.length ?? 0;
    } while (startIndex < totalResults && startIndex > 0);

    return records;
  }
}
