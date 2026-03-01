/**
 * CuratorService — orchestrates the full Curator Agent pipeline:
 * Fetch from 3rd-party API → LLM normalise/filter → Upsert to SQLite → Bust cache.
 */
import * as EventRepo   from '../repositories/EventRepository'
import * as CacheRepo   from '../repositories/CacheRepository'
import { curateEvents } from '../agents/curatorAgent'
import type { RawEvent } from '../agents/curatorAgent'
import { logger }        from '../logger'

const API_KEY      = process.env.EVENTS_API_KEY ?? ''
const API_BASE_URL = process.env.EVENTS_API_BASE_URL ?? 'https://app.ticketmaster.com/discovery/v2'
const MAX_RETRIES  = 3

/**
 * Runs the full curator pipeline for a city.
 * @returns Number of upserted events.
 */
export async function runCurator(city: string): Promise<number> {
  logger.info({ city }, '[Curator] Starting pipeline')

  let rawEvents: RawEvent[] = []

  if (API_KEY && API_KEY !== 'your-ticketmaster-api-key-here') {
    rawEvents = await fetchWithRetry(city)
  } else {
    logger.warn('[Curator] No events API key configured — using mock data')
    rawEvents = getMockRawEvents(city)
  }

  if (!rawEvents.length) {
    logger.info({ city }, '[Curator] No raw events to process')
    return 0
  }

  const normalised = await curateEvents(rawEvents, city)
  logger.info({ city, count: normalised.length }, '[Curator] LLM normalisation complete')

  let upserted = 0
  for (const event of normalised) {
    try {
      await EventRepo.upsertEvent(event)
      upserted++
    } catch (err) {
      logger.error({ err, event: event.title }, '[Curator] Upsert failed for event')
    }
  }

  // Invalidate city-specific cache so fresh data is served
  await CacheRepo.invalidate(`events:city=${city}:*`)
  await CacheRepo.invalidate('meta:cities')

  logger.info({ city, upserted }, '[Curator] Pipeline complete')
  return upserted
}

/** Fetches events from Ticketmaster Discovery API with exponential-backoff retry. */
async function fetchWithRetry(city: string, attempt = 0): Promise<RawEvent[]> {
  try {
    const params = new URLSearchParams({
      apikey:        API_KEY,
      city,
      classificationName: 'family',   // Filter for family/kids events
      size:          '50',
      sort:          'date,asc'
    })

    const res = await fetch(`${API_BASE_URL}/events.json?${params}`)

    if (!res.ok) {
      throw new Error(`Ticketmaster API error: ${res.status} ${await res.text()}`)
    }

    const data = await res.json() as {
      _embedded?: { events?: RawEvent[] }
    }

    return data._embedded?.events ?? []
  } catch (err) {
    if (attempt < MAX_RETRIES - 1) {
      const delay = Math.pow(2, attempt) * 1000
      logger.warn({ city, attempt, delay }, '[Curator] Retrying after error')
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(city, attempt + 1)
    }
    logger.error({ err, city }, '[Curator] All retries exhausted')
    return []
  }
}

/** Mock events for demo/dev when no API key is configured. */
function getMockRawEvents(city: string): RawEvent[] {
  // Use stable midnight dates so deduplication works across multiple curator runs
  const base = new Date()
  base.setDate(base.getDate() + 1)
  base.setHours(10, 0, 0, 0) // stable 10:00 AM

  const events: RawEvent[] = [
    {
      name: `Kids Science Workshop - ${city}`,
      description: 'Hands-on science experiments for curious young minds aged 5-12.',
      url: 'https://example.com/science-workshop',
      dates: { start: { dateTime: addDays(base, 0).toISOString() } },
      _embedded: { venues: [{ name: `${city} Science Centre`, city: { name: city } }] },
      images: [{ url: 'https://images.unsplash.com/photo-1532094349884-543559a035d1?w=400', width: 400 }],
      classifications: [{ segment: { name: 'Family' }, genre: { name: 'Education' } }]
    },
    {
      name: `Children\'s Art Festival - ${city}`,
      description: 'A colourful festival of art, crafts, and creativity for children aged 3-14.',
      url: 'https://example.com/art-festival',
      dates: { start: { dateTime: addDays(base, 1).toISOString() } },
      _embedded: { venues: [{ name: `${city} Arts Centre`, city: { name: city } }] },
      images: [{ url: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400', width: 400 }],
      classifications: [{ segment: { name: 'Family' }, genre: { name: 'Arts' } }]
    },
    {
      name: `Junior Football Camp - ${city}`,
      description: 'Weekend football coaching for kids aged 6-16, all skill levels welcome.',
      url: 'https://example.com/football-camp',
      dates: { start: { dateTime: addDays(base, 2).toISOString() } },
      _embedded: { venues: [{ name: `${city} Sports Ground`, city: { name: city } }] },
      images: [{ url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400', width: 400 }],
      classifications: [{ segment: { name: 'Family' }, genre: { name: 'Sports' } }]
    },
    {
      name: `Story Time & Puppet Show - ${city}`,
      description: 'Interactive storytelling and puppet performances for toddlers and young children.',
      url: 'https://example.com/story-time',
      dates: { start: { dateTime: addDays(base, 3).toISOString() } },
      _embedded: { venues: [{ name: `${city} Public Library`, city: { name: city } }] },
      images: [{ url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', width: 400 }],
      classifications: [{ segment: { name: 'Family' }, genre: { name: 'Arts' } }]
    },
    {
      name: `Kids Nature Trail - ${city} Park`,
      description: 'Guided outdoor nature walk for families with children aged 4-12.',
      url: 'https://example.com/nature-trail',
      dates: { start: { dateTime: addDays(base, 5).toISOString() } },
      _embedded: { venues: [{ name: `${city} Central Park`, city: { name: city } }] },
      images: [{ url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400', width: 400 }],
      classifications: [{ segment: { name: 'Family' }, genre: { name: 'Outdoor' } }]
    },
    {
      name: `Junior Coding Workshop - ${city}`,
      description: 'Fun introduction to coding and robotics for children aged 8-15.',
      url: 'https://example.com/coding-workshop',
      dates: { start: { dateTime: addDays(base, 7).toISOString() } },
      _embedded: { venues: [{ name: `${city} Tech Hub`, city: { name: city } }] },
      images: [{ url: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=400', width: 400 }],
      classifications: [{ segment: { name: 'Family' }, genre: { name: 'Education' } }]
    },
    {
      name: `Children\'s Dance Showcase - ${city}`,
      description: 'Annual dance performance featuring young performers aged 5-17 across multiple styles.',
      url: 'https://example.com/dance-showcase',
      dates: { start: { dateTime: addDays(base, 10).toISOString() } },
      _embedded: { venues: [{ name: `${city} Theatre`, city: { name: city } }] },
      images: [{ url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400', width: 400 }],
      classifications: [{ segment: { name: 'Family' }, genre: { name: 'Arts' } }]
    },
    {
      name: `Family Swimming Gala - ${city}`,
      description: 'Friendly swimming competition for children aged 5-14, medals for all participants.',
      url: 'https://example.com/swimming-gala',
      dates: { start: { dateTime: addDays(base, 12).toISOString() } },
      _embedded: { venues: [{ name: `${city} Aquatic Centre`, city: { name: city } }] },
      images: [{ url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400', width: 400 }],
      classifications: [{ segment: { name: 'Family' }, genre: { name: 'Sports' } }]
    }
  ]

  return events
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}
