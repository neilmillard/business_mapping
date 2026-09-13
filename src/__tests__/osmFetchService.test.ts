import { OsmFetchService } from '../ingest/services/osmFetchService';
import { IOsmApi } from '../ingest/ports/IOsmApi';

describe('OsmFetchService', () => {
  it('fetches POIs and parses the response into business records', async () => {
    const api: IOsmApi = {
      fetchPois: jest.fn().mockResolvedValue({
        elements: [{ type: 'node', id: 1, lat: 51.1, lon: -2.9, tags: { name: 'Corner Shop' } }],
      }),
    };
    const service = new OsmFetchService(api);

    const records = await service.fetchPois({
      areaSlug: 'weston-super-mare',
      postcodeDistrict: 'BS23',
      osmTags: ['shop'],
      lat: 51.345,
      lng: -2.977,
      radiusM: 1500,
      refresh: false,
    });

    expect(records).toHaveLength(1);
    expect(records[0].name).toBe('Corner Shop');
    expect(records[0].postcodeDistrict).toBe('BS23');
    expect(api.fetchPois).toHaveBeenCalledWith(expect.objectContaining({
      areaSlug: 'weston-super-mare',
      refresh: false,
      query: expect.stringContaining('shop'),
    }));
  });

  it('returns an empty array when there are no elements', async () => {
    const api: IOsmApi = { fetchPois: jest.fn().mockResolvedValue({ elements: [] }) };
    const service = new OsmFetchService(api);

    const records = await service.fetchPois({
      areaSlug: 'weston-super-mare',
      postcodeDistrict: 'BS23',
      osmTags: ['shop'],
      lat: 51.345,
      lng: -2.977,
      radiusM: 1500,
      refresh: false,
    });

    expect(records).toEqual([]);
  });
});
