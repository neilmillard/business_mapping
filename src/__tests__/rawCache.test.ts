import fs from 'fs';
import path from 'path';
import os from 'os';
import { fetchWithCache, getCacheFilePath, cacheExists } from '../ingest/rawCache';

describe('rawCache', () => {
  let originalCwd: string;
  let tmpDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raw-cache-test-'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('calls the fetcher and caches the result on first call', async () => {
    const fetcher = jest.fn().mockResolvedValue({ hello: 'world' });

    const result = await fetchWithCache('companies_house', 'BS23', false, fetcher);

    expect(result).toEqual({ hello: 'world' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(cacheExists('companies_house', 'BS23')).toBe(true);
  });

  it('returns the cached result without calling the fetcher again', async () => {
    const fetcher = jest.fn().mockResolvedValue({ hello: 'world' });

    await fetchWithCache('companies_house', 'BS23', false, fetcher);
    const second = await fetchWithCache('companies_house', 'BS23', false, fetcher);

    expect(second).toEqual({ hello: 'world' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('bypasses the cache and re-fetches when refresh is true', async () => {
    const fetcher = jest.fn()
      .mockResolvedValueOnce({ hello: 'world' })
      .mockResolvedValueOnce({ hello: 'again' });

    await fetchWithCache('companies_house', 'BS23', false, fetcher);
    const second = await fetchWithCache('companies_house', 'BS23', true, fetcher);

    expect(second).toEqual({ hello: 'again' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('reports a cache file path under data/raw/<source>/<date>/<filename>.json', () => {
    const filePath = getCacheFilePath('osm', 'weston-super-mare');
    expect(filePath).toContain(path.join('data', 'raw', 'osm'));
    expect(filePath.endsWith('weston-super-mare.json')).toBe(true);
  });
});
