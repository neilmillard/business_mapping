import { parseCompaniesToBusinessRecords } from '../ingest/companiesHouseFetcher';
import { CompaniesHouseSearchResponse } from '../ingest/ports/ICompaniesHouseApi';

describe('parseCompaniesToBusinessRecords', () => {
  it('returns an empty array when the response has no items', () => {
    const response: CompaniesHouseSearchResponse = {};

    expect(parseCompaniesToBusinessRecords(response, 'BS23')).toEqual([]);
  });

  it('maps an active company into a business record', () => {
    const response: CompaniesHouseSearchResponse = {
      items: [
        {
          company_number: '12345678',
          company_name: 'Weston Bakery Ltd',
          company_status: 'active',
          registered_office_address: {
            address_line_1: '1 High Street',
            postal_code: 'BS23 1AA',
            locality: 'Weston-super-Mare',
          },
          sic_codes: ['10710'],
        },
      ],
    };

    expect(parseCompaniesToBusinessRecords(response, 'BS23')).toEqual([
      {
        id: 'companies_house:12345678',
        companyNumber: '12345678',
        name: 'Weston Bakery Ltd',
        status: 'active',
        sicCodes: ['10710'],
        addressLine1: '1 High Street',
        postcode: 'BS23 1AA',
        locality: 'Weston-super-Mare',
        postcodeDistrict: 'BS23',
        source: 'companies_house',
      },
    ]);
  });

  it('skips companies with no name', () => {
    const response: CompaniesHouseSearchResponse = {
      items: [
        {
          company_number: '99999999',
          company_name: '',
          company_status: 'active',
        },
      ],
    };

    expect(parseCompaniesToBusinessRecords(response, 'BS23')).toEqual([]);
  });

  it('defaults missing sic codes and address fields to safe values', () => {
    const response: CompaniesHouseSearchResponse = {
      items: [
        {
          company_number: '11112222',
          company_name: 'No Address Ltd',
          company_status: 'dissolved',
        },
      ],
    };

    expect(parseCompaniesToBusinessRecords(response, 'BS22')).toEqual([
      {
        id: 'companies_house:11112222',
        companyNumber: '11112222',
        name: 'No Address Ltd',
        status: 'dissolved',
        sicCodes: [],
        addressLine1: null,
        postcode: null,
        locality: null,
        postcodeDistrict: 'BS22',
        source: 'companies_house',
      },
    ]);
  });
});
