/**
 * csvBusinessWriter — writes the deduped BusinessRecord list to a CSV file.
 */

import fs from 'fs';
import path from 'path';
import type { BusinessRecord } from '../domain/businessRecord';

const CSV_HEADERS: (keyof BusinessRecord)[] = [
  'id',
  'companyNumber',
  'name',
  'status',
  'sicCodes',
  'addressLine1',
  'postcode',
  'locality',
  'postcodeDistrict',
  'lat',
  'lng',
  'source',
];

function csvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = Array.isArray(value) ? value.join(';') : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function writeBusinessCsv(businesses: BusinessRecord[], outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const header = CSV_HEADERS.join(',');
  const rows = businesses.map((row) => CSV_HEADERS.map((key) => csvField(row[key])).join(','));

  fs.writeFileSync(outputPath, [header, ...rows].join('\n') + '\n', 'utf-8');
}
