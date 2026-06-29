import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  writeCache,
  readCache,
  isCacheStale,
  invalidateCache,
  getCacheTtlMs,
  CACHE_TTL_MS,
  CacheEntry,
} from '../src/lib/supabase/cache';

const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
}));

describe('cache helper', () => {
  const userId = 'user-123';

  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
  });

  it('should write and read valid cache successfully', async () => {
    const data = { foo: 'bar' };
    await writeCache(userId, 'conti', data);

    const result = await readCache<{ foo: string }>(userId, 'conti');
    expect(result).not.toBeNull();
    expect(result!.data).toEqual(data);
    expect(result!.version).toBe(1);
    expect(typeof result!.cachedAt).toBe('string');
  });

  it('should return null for non-existing cache key', async () => {
    const result = await readCache(userId, 'transazioni');
    expect(result).toBeNull();
  });

  it('should handle corrupt or invalid JSON in cache by removing it and returning null', async () => {
    const key = `zecchino_cache_${userId}_categorie`;
    mockStorage.set(key, '{invalid-json}');

    const result = await readCache(userId, 'categorie');
    expect(result).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
    expect(mockStorage.get(key)).toBeUndefined();
  });

  it('should remove cache and return null if cache version mismatch', async () => {
    const key = `zecchino_cache_${userId}_budget`;
    const oldEntry = {
      data: { budgetLimit: 100 },
      cachedAt: new Date().toISOString(),
      version: 0, // Mismatched version
    };
    mockStorage.set(key, JSON.stringify(oldEntry));

    const result = await readCache(userId, 'budget');
    expect(result).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
    expect(mockStorage.get(key)).toBeUndefined();
  });

  it('should remove cache and return null if required fields are missing', async () => {
    const key = `zecchino_cache_${userId}_tag`;
    const invalidEntry = {
      cachedAt: new Date().toISOString(),
      version: 1,
      // missing 'data'
    };
    mockStorage.set(key, JSON.stringify(invalidEntry));

    const result = await readCache(userId, 'tag');
    expect(result).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
  });

  it('should determine cache is not stale within TTL', async () => {
    const data = [1, 2, 3];
    await writeCache(userId, 'ricorrenze', data);

    const isStale = await isCacheStale(userId, 'ricorrenze', 60 * 1000);
    expect(isStale).toBe(false);
  });

  it('should determine cache is stale when time exceeded TTL', async () => {
    const key = `zecchino_cache_${userId}_prestiti_attivi`;
    const oldEntry: CacheEntry<number[]> = {
      data: [1, 2],
      cachedAt: new Date(Date.now() - 2000).toISOString(), // 2 seconds ago
      version: 1,
    };
    mockStorage.set(key, JSON.stringify(oldEntry));

    const isStale = await isCacheStale(userId, 'prestiti_attivi', 1000); // TTL 1 second
    expect(isStale).toBe(true);
  });

  it('should return true for isCacheStale if cache does not exist', async () => {
    const isStale = await isCacheStale(userId, 'prestiti_rimborsi');
    expect(isStale).toBe(true);
  });

  it('should get correct custom/default TTL for different tables', () => {
    const defaultTtl = getCacheTtlMs('conti');
    expect(defaultTtl).toBe(CACHE_TTL_MS);

    const notificationsTtl = getCacheTtlMs('notifiche');
    expect(notificationsTtl).toBe(60 * 60 * 1000); // 1 hour

    const simulationsTtl = getCacheTtlMs('prestiti_simulazioni');
    expect(simulationsTtl).toBe(60 * 60 * 1000); // 1 hour
  });

  it('should invalidate cache by removing all 12 tables', async () => {
    await writeCache(userId, 'conti', { balance: 100 });
    await writeCache(userId, 'transazioni', [1, 2]);

    expect(mockStorage.size).toBe(2);

    await invalidateCache(userId);

    expect(mockStorage.size).toBe(0);
    expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(12); // 12 inside invalidateCache
  });
});
