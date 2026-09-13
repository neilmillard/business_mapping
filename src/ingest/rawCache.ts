/**
 * rawCache — utility for caching raw API responses as JSON files.
 *
 * Files are stored at: data/raw/<source>/<date>/<filename>.json
 * Where <date> is today's UTC date in YYYY-MM-DD format. Ported from
 * townscan's ingest pipeline (same directory layout and cache semantics).
 */

import fs from 'fs';
import path from 'path';

function dataRawDir(): string {
  return path.join(process.cwd(), 'data', 'raw');
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function cacheFilePath(source: string, filename: string, date: string): string {
  return path.join(dataRawDir(), source, date, `${filename}.json`);
}

/**
 * Returns cached data if it exists (and refresh is false), otherwise calls
 * `fetcher`, writes the result to disk, and returns it.
 */
export async function fetchWithCache<T>(
  source: string,
  filename: string,
  refresh: boolean,
  fetcher: () => Promise<T>,
): Promise<T> {
  const date = todayUtc();
  const filePath = cacheFilePath(source, filename, date);

  if (!refresh && fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  }

  const data = await fetcher();

  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

  return data;
}

/**
 * Returns the path where a cache file would be stored for today's date.
 * Useful for inspection and testing.
 */
export function getCacheFilePath(source: string, filename: string): string {
  return cacheFilePath(source, filename, todayUtc());
}

/**
 * Checks whether a cache file exists for the given source and filename today.
 */
export function cacheExists(source: string, filename: string): boolean {
  return fs.existsSync(cacheFilePath(source, filename, todayUtc()));
}
