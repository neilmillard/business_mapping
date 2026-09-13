import { buildBusinessCensus } from '../census/build';
import type { BusinessRecord } from '../domain/businessRecord';

function record(overrides: Partial<BusinessRecord>): BusinessRecord {
  return {
    id: 'x',
    companyNumber: null,
    name: 'Weston Bakery',
    status: 'active',
    sicCodes: [],
    addressLine1: null,
    postcode: null,
    locality: null,
    postcodeDistrict: 'BS23',
    lat: null,
    lng: null,
    source: 'companies_house',
    ...overrides,
  };
}

describe('buildBusinessCensus', () => {
  it('merges records from every source and dedupes them, sorted by name', () => {
    const companiesHouse = [record({ id: 'ch:1', name: 'Zebra Print', source: 'companies_house' })];
    const googlePlaces = [record({ id: 'gp:1', name: 'Weston Bakery', source: 'google_places' })];
    const osm = [record({ id: 'osm:1', name: 'Corner Shop', source: 'osm' })];

    const census = buildBusinessCensus({ companiesHouse, googlePlaces, osm });

    expect(census.map((b) => b.name)).toEqual(['Corner Shop', 'Weston Bakery', 'Zebra Print']);
  });

  it('dedupes a business seen by multiple sources into a single row', () => {
    const companiesHouse = [record({ id: 'ch:1', name: 'Weston Bakery', source: 'companies_house', sicCodes: ['10710'] })];
    const googlePlaces = [record({ id: 'gp:1', name: 'Weston Bakery', source: 'google_places' })];

    const census = buildBusinessCensus({ companiesHouse, googlePlaces, osm: [] });

    expect(census).toHaveLength(1);
    expect(census[0].sicCodes).toEqual(['10710']);
  });

  it('returns an empty array when every source is empty', () => {
    expect(buildBusinessCensus({ companiesHouse: [], googlePlaces: [], osm: [] })).toEqual([]);
  });
});
