import { GooglePlacesApiAdapter, buildSearchNearbyRequestBody } from '../ingest/adapters/googlePlacesApiAdapter';
import { PlacesResponse } from '../ingest/googlePlacesFetcher';

jest.mock('../ingest/rawCache', () => ({
  fetchWithCache: jest.fn(),
}));

import { fetchWithCache } from '../ingest/rawCache';

const mockFetchWithCache = fetchWithCache as jest.MockedFunction<typeof fetchWithCache>;

describe('buildSearchNearbyRequestBody', () => {
  it('builds a searchNearby request body for the given place type and location', () => {
    const body = buildSearchNearbyRequestBody('bakery', 51.345, -2.977, 1500);

    expect(body).toEqual({
      includedTypes: ['bakery'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: 51.345, longitude: -2.977 },
          radius: 1500,
        },
      },
    });
  });
});

describe('GooglePlacesApiAdapter', () => {
  const adapter = new GooglePlacesApiAdapter();
  const SAMPLE_RESPONSE: PlacesResponse = {
    places: [{ id: 'place-1', displayName: { text: 'Weston Bakery' }, businessStatus: 'OPERATIONAL' }],
  };

  beforeEach(() => {
    mockFetchWithCache.mockReset();
  });

  it('returns the cached response when available', async () => {
    mockFetchWithCache.mockResolvedValue(SAMPLE_RESPONSE);

    const result = await adapter.fetchPage({
      placeType: 'bakery',
      lat: 51.345,
      lng: -2.977,
      radiusM: 1500,
      apiKey: 'key',
      areaSlug: 'weston-super-mare',
      refresh: false,
    });

    expect(result).toEqual(SAMPLE_RESPONSE);
    expect(mockFetchWithCache).toHaveBeenCalledTimes(1);
  });

  it('caches under google_places, including the area and place type in the filename', async () => {
    mockFetchWithCache.mockResolvedValue(SAMPLE_RESPONSE);

    await adapter.fetchPage({
      placeType: 'bakery',
      lat: 51.345,
      lng: -2.977,
      radiusM: 1500,
      apiKey: 'key',
      areaSlug: 'weston-super-mare',
      refresh: false,
    });

    expect(mockFetchWithCache).toHaveBeenCalledWith(
      'google_places',
      expect.stringMatching(/weston-super-mare.*bakery/),
      false,
      expect.any(Function),
    );
  });
});
