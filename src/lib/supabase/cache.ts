import AsyncStorage from '@react-native-async-storage/async-storage'

export type CacheTable = 'conti' | 'transazioni' | 'categorie' | 'budget' | 'obiettivi_risparmio'

export type CacheEntry<T> = {
  data: T
  cachedAt: string
  version: number
}

const CACHE_PREFIX = 'zecchino_cache'
const CACHE_VERSION = 1

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000

const CACHE_TABLES: CacheTable[] = ['conti', 'transazioni', 'categorie', 'budget', 'obiettivi_risparmio']

function getCacheKey(userId: string, table: CacheTable): string {
  return `${CACHE_PREFIX}_${userId}_${table}`
}

export async function writeCache<T>(userId: string, table: CacheTable, data: T): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    cachedAt: new Date().toISOString(),
    version: CACHE_VERSION,
  }

  await AsyncStorage.setItem(getCacheKey(userId, table), JSON.stringify(entry))
}

export async function readCache<T>(userId: string, table: CacheTable): Promise<CacheEntry<T> | null> {
  const raw = await AsyncStorage.getItem(getCacheKey(userId, table))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<CacheEntry<T>>
    if (
      parsed.version !== CACHE_VERSION ||
      typeof parsed.cachedAt !== 'string' ||
      !('data' in parsed)
    ) {
      await AsyncStorage.removeItem(getCacheKey(userId, table))
      return null
    }

    return parsed as CacheEntry<T>
  } catch {
    await AsyncStorage.removeItem(getCacheKey(userId, table))
    return null
  }
}

export async function isCacheStale(userId: string, table: CacheTable, ttlMs = CACHE_TTL_MS): Promise<boolean> {
  const entry = await readCache(userId, table)
  if (!entry) return true
  return Date.now() - Date.parse(entry.cachedAt) > ttlMs
}

export async function invalidateCache(userId: string): Promise<void> {
  await Promise.all(
    CACHE_TABLES.map((table) => AsyncStorage.removeItem(getCacheKey(userId, table)))
  )
}
