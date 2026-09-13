import { buildOverpassQuery, getElementCoords, parseOverpassResponse } from '../ingest/overpassFetcher';
import { OverpassResponse } from '../ingest/ports/IOsmApi';

describe('buildOverpassQuery', () => {
  it('builds an Overpass QL query for the given tags and bounding circle', () => {
    const query = buildOverpassQuery(['shop'], 51.345, -2.977, 1500);

    expect(query).toContain('[out:json][timeout:25];');
    expect(query).toContain('node["shop"](around:1500,51.345,-2.977);');
    expect(query).toContain('way["shop"](around:1500,51.345,-2.977);');
    expect(query).toContain('relation["shop"](around:1500,51.345,-2.977);');
  });

  it('builds a key=value selector when the tag has a value', () => {
    const query = buildOverpassQuery(['amenity=cafe'], 51.345, -2.977, 1500);

    expect(query).toContain('node["amenity"="cafe"](around:1500,51.345,-2.977);');
  });
});

describe('getElementCoords', () => {
  it('returns lat/lon directly for a node', () => {
    expect(getElementCoords({ type: 'node', id: 1, lat: 51.1, lon: -2.9 })).toEqual({ lat: 51.1, lng: -2.9 });
  });

  it('returns the center for a way/relation', () => {
    expect(getElementCoords({ type: 'way', id: 1, center: { lat: 51.1, lon: -2.9 } })).toEqual({ lat: 51.1, lng: -2.9 });
  });

  it('returns nulls when no coordinates are present', () => {
    expect(getElementCoords({ type: 'relation', id: 1 })).toEqual({ lat: null, lng: null });
  });
});

describe('parseOverpassResponse', () => {
  it('returns an empty array when there are no elements', () => {
    const response: OverpassResponse = { elements: [] };

    expect(parseOverpassResponse(response, 'BS23')).toEqual([]);
  });

  it('maps a named node into a business record', () => {
    const response: OverpassResponse = {
      elements: [
        {
          type: 'node',
          id: 42,
          lat: 51.345,
          lon: -2.977,
          tags: {
            name: 'Weston Bakery',
            'addr:housenumber': '1',
            'addr:street': 'High Street',
            'addr:postcode': 'BS23 1AA',
          },
        },
      ],
    };

    expect(parseOverpassResponse(response, 'BS23')).toEqual([
      {
        id: 'osm:node:42',
        companyNumber: null,
        name: 'Weston Bakery',
        status: 'active',
        sicCodes: [],
        addressLine1: '1 High Street',
        postcode: 'BS23 1AA',
        locality: null,
        postcodeDistrict: 'BS23',
        lat: 51.345,
        lng: -2.977,
        source: 'osm',
      },
    ]);
  });

  it('skips elements with no name tag', () => {
    const response: OverpassResponse = {
      elements: [{ type: 'node', id: 1, lat: 51.1, lon: -2.9, tags: {} }],
    };

    expect(parseOverpassResponse(response, 'BS23')).toEqual([]);
  });

  it('falls back to street only when there is no house number', () => {
    const response: OverpassResponse = {
      elements: [
        { type: 'way', id: 7, center: { lat: 51.1, lon: -2.9 }, tags: { name: 'Corner Shop', 'addr:street': 'High Street' } },
      ],
    };

    expect(parseOverpassResponse(response, 'BS23')[0].addressLine1).toBe('High Street');
  });
});
