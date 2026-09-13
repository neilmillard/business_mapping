/**
 * GooglePlacesApiAdapter — outbound adapter implementing IPlacesApi.
 *
 * Fetches a page of Nearby Search (New) results via HTTPS and caches the
 * raw JSON response via rawCache before returning it. Uses Places API
 * (New) `searchNearby`, which has no pagination — each fetchPage call
 * returns at most maxResultCount (20) results per place type.
 */

import https from 'https';
import { fetchWithCache } from '../rawCache';
import { PlacesResponse } from '../googlePlacesFetcher';
import { IPlacesApi, FetchPlacesParams } from '../ports/IPlacesApi';

const PLACES_BASE = 'https://places.googleapis.com/v1/places:searchNearby';

/** Requested response fields — keeps the response payload (and cache file) minimal. */
export const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.businessStatus',
  'places.types',
].join(',');

export interface SearchNearbyRequestBody {
  includedTypes: string[];
  maxResultCount: number;
  locationRestriction: {
    circle: {
      center: { latitude: number; longitude: number };
      radius: number;
    };
  };
}

/**
 * Builds the Places API (New) `searchNearby` request body for the given parameters.
 */
export function buildSearchNearbyRequestBody(
  placeType: string,
  lat: number,
  lng: number,
  radiusM: number,
): SearchNearbyRequestBody {
  return {
    includedTypes: [placeType],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusM,
      },
    },
  };
}

/**
 * Makes a POST request with a JSON body and parses the JSON response.
 */
/* istanbul ignore next */
export function httpPostJson<T>(
  url: string,
  requestBody: unknown,
  headers: Record<string, string>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(requestBody);
    const req = https.request(
      url,
      { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(payload) } },
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
 * Concrete implementation of IPlacesApi that fetches from Google's API
 * and caches each response's raw JSON to data/raw/google_places/<date>/.
 */
export class GooglePlacesApiAdapter implements IPlacesApi {
  async fetchPage(params: FetchPlacesParams): Promise<PlacesResponse> {
    const { placeType, lat, lng, radiusM, apiKey, areaSlug, refresh } = params;

    const filename = `${areaSlug}_${placeType}`;

    return fetchWithCache<PlacesResponse>(
      'google_places',
      filename,
      refresh,
      async () => {
        const body = buildSearchNearbyRequestBody(placeType, lat, lng, radiusM);
        return httpPostJson<PlacesResponse>(PLACES_BASE, body, {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        });
      },
    );
  }
}
