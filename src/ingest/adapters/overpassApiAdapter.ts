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
          // overpass-api.de's Apache front-end returns 406 Not Acceptable
          // for requests with no User-Agent header — Node's https.request
          // sends none by default, unlike curl or a browser.
          'User-Agent': 'business_mapping-ingest/0.1 (+https://github.com/neilmillard/business_mapping)',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode} from Overpass API: ${body.slice(0, 200)}`));
            return;
          }
          try {
            resolve(JSON.parse(body) as T);
          } catch (err) {
            reject(new Error(`Failed to parse JSON response (status ${res.statusCode}): ${(err as Error).message}`));
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
