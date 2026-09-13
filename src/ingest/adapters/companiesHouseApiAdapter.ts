/**
 * CompaniesHouseApiAdapter — outbound adapter implementing ICompaniesHouseApi.
 *
 * Fetches a page of company search results via HTTPS and caches the raw
 * JSON response via rawCache before returning it. Ported from townscan's
 * companiesHouseApiAdapter, scoped to location-only search (no SIC-code
 * filter — this pipeline wants the full business census, not one trade
 * category at a time).
 */

import https from 'https';
import { fetchWithCache } from '../rawCache';
import { ICompaniesHouseApi, SearchCompaniesParams, CompaniesHouseSearchResponse } from '../ports/ICompaniesHouseApi';

const CH_BASE = 'https://api.company-information.service.gov.uk/advanced-search/companies';

/**
 * Builds the Companies House Advanced Search URL for a postcode district.
 */
export function buildCompaniesHouseUrl(
  postcodeDistrict: string,
  status: 'active' | 'dissolved',
  startIndex: number,
): string {
  const params = new URLSearchParams({
    location: postcodeDistrict,
    company_status: status,
    start_index: String(startIndex),
    size: '20',
  });
  return `${CH_BASE}?${params.toString()}`;
}

/**
 * Makes an authenticated GET request to Companies House and parses JSON.
 * Basic auth: API key as username, empty password.
 */
/* istanbul ignore next */
export function httpGetJsonAuth<T>(url: string, apiKey: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
    };
    https.get(url, options, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} from Companies House API: ${body.slice(0, 200)}`));
          return;
        }
        if (!body) {
          reject(new Error(`Empty response from Companies House API (status ${res.statusCode})`));
          return;
        }
        try {
          resolve(JSON.parse(body) as T);
        } catch (err) {
          reject(new Error(`Failed to parse JSON response (status ${res.statusCode}): ${(err as Error).message} — body: ${body.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Concrete implementation of ICompaniesHouseApi that fetches from
 * the Companies House Advanced Search API and caches raw JSON to
 * data/raw/companies_house/<date>/.
 */
export class CompaniesHouseApiAdapter implements ICompaniesHouseApi {
  async searchCompanies(params: SearchCompaniesParams): Promise<CompaniesHouseSearchResponse> {
    const { postcodeDistrict, status, apiKey, refresh, startIndex = 0 } = params;

    const filename = `${postcodeDistrict}_${status}_idx${startIndex}`;

    return fetchWithCache<CompaniesHouseSearchResponse>(
      'companies_house',
      filename,
      refresh,
      async () => {
        const url = buildCompaniesHouseUrl(postcodeDistrict, status, startIndex);
        return httpGetJsonAuth<CompaniesHouseSearchResponse>(url, apiKey);
      },
    );
  }
}
