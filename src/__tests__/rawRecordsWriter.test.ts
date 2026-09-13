import fs from 'fs';
import path from 'path';
import os from 'os';
import { writeRawRecords, readRawRecords, parsedRecordsPath } from '../ingest/rawRecordsWriter';
import type { BusinessRecord } from '../domain/businessRecord';

const SAMPLE: BusinessRecord = {
  id: 'companies_house:1',
  companyNumber: '1',
  name: 'A Ltd',
  status: 'active',
  sicCodes: [],
  addressLine1: null,
  postcode: null,
  locality: null,
  postcodeDistrict: 'BS23',
  lat: null,
  lng: null,
  source: 'companies_house',
};

describe('rawRecordsWriter', () => {
  let originalCwd: string;
  let tmpDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raw-records-writer-test-'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes records to data/parsed/<source>/<areaSlug>.json', () => {
    writeRawRecords('companies_house', 'weston-super-mare', [SAMPLE]);

    const filePath = parsedRecordsPath('companies_house', 'weston-super-mare');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toBe(path.join(tmpDir, 'data', 'parsed', 'companies_house', 'weston-super-mare.json'));
  });

  it('round-trips records written for an area and source', () => {
    writeRawRecords('osm', 'weston-super-mare', [SAMPLE]);

    expect(readRawRecords('osm', 'weston-super-mare')).toEqual([SAMPLE]);
  });

  it('returns an empty array when no records have been written for a source', () => {
    expect(readRawRecords('google_places', 'weston-super-mare')).toEqual([]);
  });
});
