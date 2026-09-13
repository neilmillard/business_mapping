/**
 * IOsmApi — port (interface) for fetching OpenStreetMap / Overpass API data.
 */

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

export interface FetchOsmParams {
  /** Overpass QL query string */
  query: string;
  areaSlug: string;
  refresh: boolean;
}

export interface IOsmApi {
  /** Executes an Overpass QL query and returns the raw element list. */
  fetchPois(params: FetchOsmParams): Promise<OverpassResponse>;
}
