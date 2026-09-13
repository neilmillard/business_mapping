import { OverpassApiAdapter } from '../ingest/adapters/overpassApiAdapter';
import { OverpassResponse } from '../ingest/ports/IOsmApi';

jest.mock('../ingest/rawCache', () => ({
  fetchWithCache: jest.fn(),
}));

import { fetchWithCache } from '../ingest/rawCache';

const mockFetchWithCache = fetchWithCache as jest.MockedFunction<typeof fetchWithCache>;

describe('OverpassApiAdapter', () => {
  const adapter = new OverpassApiAdapter();
  const SAMPLE_RESPONSE: OverpassResponse = {
    elements: [{ type: 'node', id: 1, lat: 51.1, lon: -2.9, tags: { name: 'Corner Shop' } }],
  };

  beforeEach(() => {
    mockFetchWithCache.mockReset();
  });

  it('returns the cached response when available', async () => {
    mockFetchWithCache.mockResolvedValue(SAMPLE_RESPONSE);

    const result = await adapter.fetchPois({
      query: '[out:json];',
      areaSlug: 'weston-super-mare',
      refresh: false,
    });

    expect(result).toEqual(SAMPLE_RESPONSE);
    expect(mockFetchWithCache).toHaveBeenCalledTimes(1);
  });

  it('caches under osm, including the area in the filename', async () => {
    mockFetchWithCache.mockResolvedValue(SAMPLE_RESPONSE);

    await adapter.fetchPois({
      query: '[out:json];',
      areaSlug: 'weston-super-mare',
      refresh: false,
    });

    expect(mockFetchWithCache).toHaveBeenCalledWith(
      'osm',
      expect.stringContaining('weston-super-mare'),
      false,
      expect.any(Function),
    );
  });
});
