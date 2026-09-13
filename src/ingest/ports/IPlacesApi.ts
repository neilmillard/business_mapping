/**
 * IPlacesApi — port (interface) for fetching raw Google Places API responses.
 */

import { PlacesResponse } from '../googlePlacesFetcher';

export interface FetchPlacesParams {
  placeType: string;
  lat: number;
  lng: number;
  radiusM: number;
  apiKey: string;
  areaSlug: string;
  refresh: boolean;
}

export interface IPlacesApi {
  /** Fetches a single page of Nearby Search results. */
  fetchPage(params: FetchPlacesParams): Promise<PlacesResponse>;
}
