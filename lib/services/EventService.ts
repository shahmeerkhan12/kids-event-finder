/**
 * EventService — event retrieval with cache-first strategy.
 */
import * as EventRepo  from '../repositories/EventRepository'
import * as CacheRepo  from '../repositories/CacheRepository'
import type { KidsEvent, EventFilters } from '../types'

/**
 * Retrieves filtered events: cache hit → return; miss → query DB → cache → return.
 */
export async function getEvents(filters: EventFilters): Promise<KidsEvent[]> {
  const cacheKey = CacheRepo.buildEventCacheKey({
    city:     filters.city,
    ageMin:   filters.ageMin,
    ageMax:   filters.ageMax,
    category: filters.category,
    dateFrom: filters.dateFrom?.toISOString(),
    dateTo:   filters.dateTo?.toISOString()
  })

  const cached = await CacheRepo.get<KidsEvent[]>(cacheKey)
  if (cached) return cached

  const events = await EventRepo.queryEvents(filters)
  await CacheRepo.set(cacheKey, events)
  return events
}

/**
 * Retrieves a single event by ID.
 */
export async function getEventById(id: string): Promise<KidsEvent | null> {
  const cacheKey = `event:${id}`
  const cached = await CacheRepo.get<KidsEvent>(cacheKey)
  if (cached) return cached

  const event = await EventRepo.getEventById(id)
  if (event) await CacheRepo.set(cacheKey, event, 600) // 10-min TTL for detail pages
  return event
}

/**
 * Returns available cities for the city selector.
 */
export async function getAvailableCities(): Promise<string[]> {
  const cacheKey = 'meta:cities'
  const cached = await CacheRepo.get<string[]>(cacheKey)
  if (cached) return cached

  const cities = await EventRepo.getAvailableCities()
  await CacheRepo.set(cacheKey, cities, 3600) // 1-hour TTL
  return cities
}
