/**
 * CacheRepository — thin wrapper around the in-memory cache client.
 * Converts TTL from seconds (public API) to milliseconds (internal).
 */
import { cache } from '../cache/client'

const DEFAULT_TTL_S = Number(process.env.CACHE_TTL_SECONDS ?? 300)

/**
 * Gets a cached value by key.
 * @returns Parsed value or null on miss/expiry.
 */
export async function get<T>(key: string): Promise<T | null> {
  return cache.get<T>(key)
}

/**
 * Sets a cache value with optional TTL (seconds).
 */
export async function set<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL_S
): Promise<void> {
  cache.set<T>(key, value, ttlSeconds * 1000)
}

/**
 * Invalidates all cache keys matching a prefix pattern
 * (e.g. 'events:london:*' will delete all keys starting with 'events:london:').
 */
export async function invalidate(pattern: string): Promise<void> {
  cache.invalidate(pattern)
}

/**
 * Builds a canonical cache key for event listing queries.
 */
export function buildEventCacheKey(params: Record<string, string | number | undefined>): string {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k] ?? ''}`)
    .join(':')
  return `events:${sorted}`
}
