/**
 * In-memory cache client with TTL support.
 * Lightweight replacement for Redis suitable for small-scale deployments.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECONDS ?? 300) * 1000

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  /** Delete all keys matching a simple prefix pattern (e.g. 'events:london:*') */
  invalidate(pattern: string): void {
    const prefix = pattern.replace(/\*$/, '')
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }

  clear(): void {
    this.store.clear()
  }
}

// Singleton cache instance
export const cache = new MemoryCache()
