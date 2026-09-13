import { CompaniesHouseApiAdapter, buildCompaniesHouseUrl } from '../ingest/adapters/companiesHouseApiAdapter';
import { CompaniesHouseSearchResponse } from '../ingest/ports/ICompaniesHouseApi';

jest.mock('../ingest/rawCache', () => ({
  fetchWithCache: jest.fn(),
}));

import { fetchWithCache } from '../ingest/rawCache';

const mockFetchWithCache = fetchWithCache as jest.MockedFunction<typeof fetchWithCache>;

describe('buildCompaniesHouseUrl', () => {
  it('builds a search URL with postcode district and status', () => {
    const url = buildCompaniesHouseUrl('BS23', 'active', 0);
    expect(url).toContain('https://api.company-information.service.gov.uk/advanced-search/companies');
    expect(url).toContain('location=BS23');
    expect(url).toContain('company_status=active');
    expect(url).toContain('start_index=0');
  });

  it('builds a dissolved company search URL with a pagination offset', () => {
    const url = buildCompaniesHouseUrl('BS22', 'dissolved', 50);
    expect(url).toContain('company_status=dissolved');
    expect(url).toContain('location=BS22');
    expect(url).toContain('start_index=50');
  });
});

describe('CompaniesHouseApiAdapter', () => {
  const adapter = new CompaniesHouseApiAdapter();
  const SAMPLE_RESPONSE: CompaniesHouseSearchResponse = {
    items: [{ company_number: '12345678', company_name: 'Test Ltd', company_status: 'active' }],
    total_results: 1,
    items_per_page: 20,
    start_index: 0,
  };

  beforeEach(() => {
    mockFetchWithCache.mockReset();
  });

  it('returns the cached response when available', async () => {
    mockFetchWithCache.mockResolvedValue(SAMPLE_RESPONSE);

    const result = await adapter.searchCompanies({
      postcodeDistrict: 'BS23',
      status: 'active',
      apiKey: 'test-key',
      refresh: false,
    });

    expect(result).toEqual(SAMPLE_RESPONSE);
    expect(mockFetchWithCache).toHaveBeenCalledTimes(1);
  });

  it('uses companies_house as the cache source and includes the postcode district in the filename', async () => {
    mockFetchWithCache.mockResolvedValue(SAMPLE_RESPONSE);

    await adapter.searchCompanies({
      postcodeDistrict: 'BS23',
      status: 'active',
      apiKey: 'test-key',
      refresh: false,
    });

    expect(mockFetchWithCache).toHaveBeenCalledWith(
      'companies_house',
      expect.stringContaining('BS23'),
      false,
      expect.any(Function),
    );
  });

  it('includes startIndex in the cache filename when provided', async () => {
    mockFetchWithCache.mockResolvedValue(SAMPLE_RESPONSE);

    await adapter.searchCompanies({
      postcodeDistrict: 'BS23',
      status: 'active',
      apiKey: 'test-key',
      refresh: false,
      startIndex: 50,
    });

    expect(mockFetchWithCache).toHaveBeenCalledWith(
      'companies_house',
      expect.stringContaining('50'),
      false,
      expect.any(Function),
    );
  });

  it('passes refresh through to fetchWithCache', async () => {
    mockFetchWithCache.mockResolvedValue(SAMPLE_RESPONSE);

    await adapter.searchCompanies({
      postcodeDistrict: 'BS23',
      status: 'active',
      apiKey: 'test-key',
      refresh: true,
    });

    expect(mockFetchWithCache).toHaveBeenCalledWith(
      'companies_house',
      expect.any(String),
      true,
      expect.any(Function),
    );
  });
});
