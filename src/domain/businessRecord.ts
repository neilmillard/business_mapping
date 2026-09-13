/**
 * BusinessRecord — the canonical shape shared by every ingest source
 * (Companies House, Google Places, OSM) once parsed. The census/dedupe
 * step operates only on this shape, so it never needs to know about
 * any single source's raw response format.
 */
export interface BusinessRecord {
  id: string;
  companyNumber: string | null;
  name: string;
  status: string;
  sicCodes: string[];
  addressLine1: string | null;
  postcode: string | null;
  locality: string | null;
  postcodeDistrict: string;
  lat: number | null;
  lng: number | null;
  source: 'companies_house' | 'google_places' | 'osm';
}
