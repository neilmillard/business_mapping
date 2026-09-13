import fs from 'fs';
import path from 'path';
import os from 'os';
import { writeBusinessCsv } from '../census/csvBusinessWriter';
import type { BusinessRecord } from '../domain/businessRecord';

describe('writeBusinessCsv', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csv-business-writer-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes a header row and one row per business', () => {
    const outPath = path.join(tmpDir, 'reports', 'census_weston-super-mare.csv');
    const businesses: BusinessRecord[] = [
      {
        id: 'companies_house:1',
        companyNumber: '1',
        name: 'Weston Bakery',
        status: 'active',
        sicCodes: ['10710'],
        addressLine1: '1 High Street',
        postcode: 'BS23 1AA',
        locality: 'Weston-super-Mare',
        postcodeDistrict: 'BS23',
        lat: 51.345,
        lng: -2.977,
        source: 'companies_house',
      },
    ];

    writeBusinessCsv(businesses, outPath);

    const content = fs.readFileSync(outPath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines[0]).toBe('id,companyNumber,name,status,sicCodes,addressLine1,postcode,locality,postcodeDistrict,lat,lng,source');
    expect(lines[1]).toBe('companies_house:1,1,Weston Bakery,active,10710,1 High Street,BS23 1AA,Weston-super-Mare,BS23,51.345,-2.977,companies_house');
  });

  it('creates the output directory if it does not exist', () => {
    const outPath = path.join(tmpDir, 'nested', 'reports', 'census.csv');

    writeBusinessCsv([], outPath);

    expect(fs.existsSync(outPath)).toBe(true);
  });

  it('escapes fields containing commas', () => {
    const outPath = path.join(tmpDir, 'census.csv');
    const businesses: BusinessRecord[] = [
      {
        id: 'osm:node:1',
        companyNumber: null,
        name: 'Weston, Bakery & Cafe',
        status: 'active',
        sicCodes: [],
        addressLine1: null,
        postcode: null,
        locality: null,
        postcodeDistrict: 'BS23',
        lat: null,
        lng: null,
        source: 'osm',
      },
    ];

    writeBusinessCsv(businesses, outPath);

    const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
    expect(lines[1]).toContain('"Weston, Bakery & Cafe"');
  });
});
