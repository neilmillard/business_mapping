/**
 * OverpassApiAdapter — outbound adapter implementing IOsmApi.
 *
 * Executes an Overpass QL query via HTTPS POST and caches the raw JSON
 * response via rawCache before returning it.
 */

import https from 'https';
import { fetchWithCache } from '../rawCache';
import { IOsmApi, FetchOsmParams, OverpassResponse } from '../ports/IOsmApi';

const OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';

/**
 * Makes a POST request with an Overpass QL query body and parses the JSON response.
 */
/* istanbul ignore next */
export function httpPostQuery<T>(url: string, query: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const payload = `data=${encodeURIComponent(query)}`;
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body) as T);
          } catch (err) {
            reject(new Error(`Failed to parse JSON response: ${(err as Error).message}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Concrete implementation of IOsmApi that fetches from the Overpass API
 * and caches raw JSON to data/raw/osm/<date>/.
 */
export class OverpassApiAdapter implements IOsmApi {
  async fetchPois(params: FetchOsmParams): Promise<OverpassResponse> {
    const { query, areaSlug, refresh } = params;

    return fetchWithCache<OverpassResponse>(
      'osm',
      areaSlug,
      refresh,
      async () => httpPostQuery<OverpassResponse>(OVERPASS_BASE, query),
    );
  }
}
