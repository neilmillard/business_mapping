import { normaliseBusinessName, haversineDistanceM, areDuplicates, deduplicateBusinesses, mergeSicCodes } from '../census/dedupe';
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

describe('normaliseBusinessName', () => {
  it('lowercases, strips punctuation, and removes stop words', () => {
    expect(normaliseBusinessName("The Weston Bakery Ltd.")).toBe('weston bakery ltd');
    expect(normaliseBusinessName("Joe's Cafe")).toBe('joes cafe');
    expect(normaliseBusinessName('  A  Shop  ')).toBe('shop');
  });
});

describe('haversineDistanceM', () => {
  it('returns null when any coordinate is null', () => {
    expect(haversineDistanceM(null, -2.9, 51.1, -2.9)).toBeNull();
  });

  it('returns 0 for identical coordinates', () => {
    expect(haversineDistanceM(51.1, -2.9, 51.1, -2.9)).toBe(0);
  });

  it('returns a small positive distance for nearby coordinates', () => {
    const dist = haversineDistanceM(51.345, -2.977, 51.346, -2.977);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(200);
  });
});

describe('areDuplicates', () => {
  it('treats identical ids as duplicates', () => {
    const a = record({ id: 'a' });
    expect(areDuplicates(a, a)).toBe(true);
  });

  it('treats matching normalised names within 100m as duplicates', () => {
    const a = record({ id: 'a', name: 'Weston Bakery', lat: 51.345, lng: -2.977 });
    const b = record({ id: 'b', name: 'The Weston Bakery', lat: 51.3451, lng: -2.977 });
    expect(areDuplicates(a, b)).toBe(true);
  });

  it('does not treat matching names far apart as duplicates', () => {
    const a = record({ id: 'a', name: 'Weston Bakery', lat: 51.345, lng: -2.977 });
    const b = record({ id: 'b', name: 'Weston Bakery', lat: 51.5, lng: -2.5 });
    expect(areDuplicates(a, b)).toBe(false);
  });

  it('falls back to name-only matching when both records lack coordinates', () => {
    const a = record({ id: 'a', name: 'Weston Bakery', lat: null, lng: null });
    const b = record({ id: 'b', name: 'Weston Bakery', lat: null, lng: null });
    expect(areDuplicates(a, b)).toBe(true);
  });

  it('does not treat different names as duplicates', () => {
    const a = record({ id: 'a', name: 'Weston Bakery' });
    const b = record({ id: 'b', name: 'Corner Shop' });
    expect(areDuplicates(a, b)).toBe(false);
  });
});

describe('mergeSicCodes', () => {
  it('merges and dedupes SIC codes from two records', () => {
    expect(mergeSicCodes(record({ sicCodes: ['10710'] }), record({ sicCodes: ['10710', '56102'] })))
      .toEqual(['10710', '56102']);
  });
});

describe('deduplicateBusinesses', () => {
  it('returns an empty array for no input', () => {
    expect(deduplicateBusinesses([])).toEqual([]);
  });

  it('keeps a single record when there are no duplicates', () => {
    const businesses = [record({ id: 'a', name: 'Weston Bakery' }), record({ id: 'b', name: 'Corner Shop' })];
    expect(deduplicateBusinesses(businesses)).toHaveLength(2);
  });

  it('prefers google_places over osm over companies_house for duplicates, merging SIC codes', () => {
    const ch = record({ id: 'ch:1', name: 'Weston Bakery', source: 'companies_house', sicCodes: ['10710'], lat: 51.345, lng: -2.977 });
    const osm = record({ id: 'osm:1', name: 'Weston Bakery', source: 'osm', lat: 51.3451, lng: -2.977 });
    const google = record({ id: 'gp:1', name: 'Weston Bakery', source: 'google_places', lat: 51.345, lng: -2.9771 });

    const deduped = deduplicateBusinesses([ch, osm, google]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].source).toBe('google_places');
    expect(deduped[0].sicCodes).toEqual(['10710']);
  });
});
