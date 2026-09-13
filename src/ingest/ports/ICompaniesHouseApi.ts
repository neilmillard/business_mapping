export interface SearchCompaniesParams {
  postcodeDistrict: string;
  status: 'active' | 'dissolved';
  apiKey: string;
  refresh: boolean;
  startIndex?: number;
}

export interface CompanyItem {
  company_number: string;
  company_name: string;
  company_status: string;
  registered_office_address?: {
    address_line_1?: string;
    postal_code?: string;
    locality?: string;
  };
  sic_codes?: string[];
}

export interface CompaniesHouseSearchResponse {
  items?: CompanyItem[];
  total_results?: number;
  start_index?: number;
  items_per_page?: number;
}

export interface ICompaniesHouseApi {
  searchCompanies(params: SearchCompaniesParams): Promise<CompaniesHouseSearchResponse>;
}
