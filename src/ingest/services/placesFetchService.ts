/**
 * PlacesFetchService — domain service (hexagonal core).
 *
 * Orchestrates a single IPlacesApi.fetchPage() call and parses the response
 * into BusinessRecords via the pure parser. Knows nothing about HTTP or
 * the file system.
 */

import { parsePlacesResponse } from '../googlePlacesFetcher';
import { IPlacesApi } from '../ports/IPlacesApi';
import type { BusinessRecord } from '../../domain/businessRecord';

export interface FetchPlaceTypeOptions {
  placeType: string;
  lat: number;
  lng: number;
  radiusM: number;
  apiKey: string;
  areaSlug: string;
  postcodeDistrict: string;
  refresh: boolean;
}

export class PlacesFetchService {
  constructor(private readonly placesApi: IPlacesApi) {}

  async fetchPlaceType(opts: FetchPlaceTypeOptions): Promise<BusinessRecord[]> {
    const { placeType, lat, lng, radiusM, apiKey, areaSlug, postcodeDistrict, refresh } = opts;

    const response = await this.placesApi.fetchPage({
      placeType, lat, lng, radiusM, apiKey, areaSlug, refresh,
    });

    return parsePlacesResponse(response, postcodeDistrict);
  }
}
