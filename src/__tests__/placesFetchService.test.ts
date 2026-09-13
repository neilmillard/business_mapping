import { PlacesFetchService } from '../ingest/services/placesFetchService';
import { IPlacesApi } from '../ingest/ports/IPlacesApi';

describe('PlacesFetchService', () => {
  it('fetches a place type and parses the response into business records', async () => {
    const api: IPlacesApi = {
      fetchPage: jest.fn().mockResolvedValue({
        places: [{ id: 'place-1', displayName: { text: 'Weston Bakery' }, businessStatus: 'OPERATIONAL' }],
      }),
    };
    const service = new PlacesFetchService(api);

    const records = await service.fetchPlaceType({
      placeType: 'bakery',
      lat: 51.345,
      lng: -2.977,
      radiusM: 1500,
      apiKey: 'key',
      areaSlug: 'weston-super-mare',
      postcodeDistrict: 'BS23',
      refresh: false,
    });

    expect(records).toHaveLength(1);
    expect(records[0].name).toBe('Weston Bakery');
    expect(records[0].postcodeDistrict).toBe('BS23');
    expect(api.fetchPage).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when there are no places', async () => {
    const api: IPlacesApi = { fetchPage: jest.fn().mockResolvedValue({}) };
    const service = new PlacesFetchService(api);

    const records = await service.fetchPlaceType({
      placeType: 'bakery',
      lat: 51.345,
      lng: -2.977,
      radiusM: 1500,
      apiKey: 'key',
      areaSlug: 'weston-super-mare',
      postcodeDistrict: 'BS23',
      refresh: false,
    });

    expect(records).toEqual([]);
  });
});
