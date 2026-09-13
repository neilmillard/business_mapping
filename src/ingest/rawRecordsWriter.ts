/**
 * rawRecordsWriter — persists each source's parsed BusinessRecords to disk
 * so census:build can merge and dedupe them without needing a database.
 *
 * Files are stored at: data/parsed/<source>/<areaSlug>.json
 */

import fs from 'fs';
import path from 'path';
import type { BusinessRecord } from '../domain/businessRecord';

function dataParsedDir(): string {
  return path.join(process.cwd(), 'data', 'parsed');
}

export function parsedRecordsPath(source: string, areaSlug: string): string {
  return path.join(dataParsedDir(), source, `${areaSlug}.json`);
}

export function writeRawRecords(source: string, areaSlug: string, records: BusinessRecord[]): void {
  const filePath = parsedRecordsPath(source, areaSlug);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
}

export function readRawRecords(source: string, areaSlug: string): BusinessRecord[] {
  const filePath = parsedRecordsPath(source, areaSlug);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as BusinessRecord[];
}
