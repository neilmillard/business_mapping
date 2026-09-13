import { parsePlacesResponse } from '../ingest/googlePlacesFetcher';
import { PlacesResponse } from '../ingest/googlePlacesFetcher';

describe('parsePlacesResponse', () => {
  it('returns an empty array when the response has no places', () => {
    const response: PlacesResponse = {};

    expect(parsePlacesResponse(response, 'BS23')).toEqual([]);
  });

  it('maps an operational place into a business record', () => {
    const response: PlacesResponse = {
      places: [
        {
          id: 'place-1',
          displayName: { text: 'Weston Bakery' },
          formattedAddress: '1 High Street, Weston-super-Mare, BS23 1AA',
          location: { latitude: 51.345, longitude: -2.977 },
          businessStatus: 'OPERATIONAL',
        },
      ],
    };

    expect(parsePlacesResponse(response, 'BS23')).toEqual([
      {
        id: 'google_places:place-1',
        companyNumber: null,
        name: 'Weston Bakery',
        status: 'active',
        sicCodes: [],
        addressLine1: '1 High Street, Weston-super-Mare, BS23 1AA',
        postcode: 'BS23 1AA',
        locality: null,
        postcodeDistrict: 'BS23',
        lat: 51.345,
        lng: -2.977,
        source: 'google_places',
      },
    ]);
  });

  it('derives the postcode district from the address even when it differs from the search area', () => {
    const response: PlacesResponse = {
      places: [
        {
          id: 'place-4',
          displayName: { text: 'Oldmixon Trading Co' },
          formattedAddress: 'Oldmixon Crescent, Weston-super-Mare, BS24 9AW, UK',
          businessStatus: 'OPERATIONAL',
        },
      ],
    };

    const [record] = parsePlacesResponse(response, 'BS23');

    expect(record.postcode).toBe('BS24 9AW');
    expect(record.postcodeDistrict).toBe('BS24');
  });

  it('falls back to the search area district when the address has no postcode', () => {
    const response: PlacesResponse = {
      places: [
        {
          id: 'place-5',
          displayName: { text: 'No Postcode Shop' },
          businessStatus: 'OPERATIONAL',
        },
      ],
    };

    expect(parsePlacesResponse(response, 'BS23')[0].postcodeDistrict).toBe('BS23');
  });

  it('maps a closed place to status closed', () => {
    const response: PlacesResponse = {
      places: [
        {
          id: 'place-2',
          displayName: { text: 'Old Shop' },
          businessStatus: 'CLOSED_PERMANENTLY',
        },
      ],
    };

    expect(parsePlacesResponse(response, 'BS22')[0].status).toBe('closed');
  });

  it('defaults an unknown business status to unknown', () => {
    const response: PlacesResponse = {
      places: [
        {
          id: 'place-3',
          displayName: { text: 'Mystery Shop' },
        },
      ],
    };

    expect(parsePlacesResponse(response, 'BS22')[0].status).toBe('unknown');
  });
});
