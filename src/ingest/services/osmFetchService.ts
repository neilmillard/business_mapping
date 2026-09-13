/**
 * OsmFetchService — domain service (hexagonal core).
 *
 * Orchestrates a single IOsmApi.fetchPois() call and parses the response
 * into BusinessRecords via the pure parser. Knows nothing about HTTP or
 * the file system.
 */

import { buildOverpassQuery, parseOverpassResponse } from '../overpassFetcher';
import { IOsmApi } from '../ports/IOsmApi';
import type { BusinessRecord } from '../../domain/businessRecord';

export interface FetchOsmOptions {
  areaSlug: string;
  postcodeDistrict: string;
  osmTags: string[];
  lat: number;
  lng: number;
  radiusM: number;
  refresh: boolean;
}

export class OsmFetchService {
  constructor(private readonly osmApi: IOsmApi) {}

  async fetchPois(opts: FetchOsmOptions): Promise<BusinessRecord[]> {
    const { areaSlug, postcodeDistrict, osmTags, lat, lng, radiusM, refresh } = opts;

    const query = buildOverpassQuery(osmTags, lat, lng, radiusM);

    const response = await this.osmApi.fetchPois({ query, areaSlug, refresh });

    return parseOverpassResponse(response, postcodeDistrict);
  }
}
