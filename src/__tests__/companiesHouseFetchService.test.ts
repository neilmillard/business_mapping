import { CompaniesHouseFetchService } from '../ingest/services/companiesHouseFetchService';
import { ICompaniesHouseApi, CompaniesHouseSearchResponse, SearchCompaniesParams } from '../ingest/ports/ICompaniesHouseApi';

function page(items: CompaniesHouseSearchResponse['items'], totalResults: number, startIndex: number): CompaniesHouseSearchResponse {
  return { items, total_results: totalResults, start_index: startIndex, items_per_page: items?.length ?? 0 };
}

describe('CompaniesHouseFetchService', () => {
  it('fetches a single page when total_results fits within one page', async () => {
    const api: ICompaniesHouseApi = {
      searchCompanies: jest.fn<Promise<CompaniesHouseSearchResponse>, [SearchCompaniesParams]>()
        .mockResolvedValueOnce(page([
          { company_number: '1', company_name: 'A Ltd', company_status: 'active' },
        ], 1, 0)),
    };
    const service = new CompaniesHouseFetchService(api);

    const records = await service.fetchDistrict({ postcodeDistrict: 'BS23', status: 'active', apiKey: 'key', refresh: false });

    expect(records).toHaveLength(1);
    expect(records[0].name).toBe('A Ltd');
    expect(api.searchCompanies).toHaveBeenCalledTimes(1);
  });

  it('follows pagination until every result has been fetched', async () => {
    const searchCompanies = jest.fn<Promise<CompaniesHouseSearchResponse>, [SearchCompaniesParams]>()
      .mockResolvedValueOnce(page([
        { company_number: '1', company_name: 'A Ltd', company_status: 'active' },
      ], 2, 0))
      .mockResolvedValueOnce(page([
        { company_number: '2', company_name: 'B Ltd', company_status: 'active' },
      ], 2, 1));
    const api: ICompaniesHouseApi = { searchCompanies };
    const service = new CompaniesHouseFetchService(api);

    const records = await service.fetchDistrict({ postcodeDistrict: 'BS23', status: 'active', apiKey: 'key', refresh: false });

    expect(records.map((r) => r.name)).toEqual(['A Ltd', 'B Ltd']);
    expect(searchCompanies).toHaveBeenNthCalledWith(1, expect.objectContaining({ startIndex: 0 }));
    expect(searchCompanies).toHaveBeenNthCalledWith(2, expect.objectContaining({ startIndex: 1 }));
  });

  it('returns an empty array when there are no results', async () => {
    const api: ICompaniesHouseApi = {
      searchCompanies: jest.fn<Promise<CompaniesHouseSearchResponse>, [SearchCompaniesParams]>()
        .mockResolvedValueOnce(page([], 0, 0)),
    };
    const service = new CompaniesHouseFetchService(api);

    const records = await service.fetchDistrict({ postcodeDistrict: 'BS23', status: 'active', apiKey: 'key', refresh: false });

    expect(records).toEqual([]);
  });
});
