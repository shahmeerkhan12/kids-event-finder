/**
 * Agent 1 — Event Curator Agent.
 *
 * Given a list of raw events from a 3rd-party API, uses the DeployAI LLM to:
 * 1. Filter events relevant to children (ages 0-18).
 * 2. Normalise each event into the KidsEvent schema.
 * 3. Return structured JSON for upsert into SQLite.
 */
import { askOnce } from './deployai'
import type { KidsEvent, EventCategory } from '../types'

/** Minimal raw event shape returned by the 3rd-party API. */
export interface RawEvent {
  id?: string
  name?: string
  title?: string
  description?: string
  url?: string
  dates?: {
    start?: { localDate?: string; localTime?: string; dateTime?: string }
  }
  _embedded?: {
    venues?: Array<{ name?: string; city?: { name?: string } }>
  }
  images?: Array<{ url?: string; width?: number }>
  classifications?: Array<{
    segment?: { name?: string }
    genre?: { name?: string }
  }>
}

const SYSTEM_PROMPT = `You are an expert children's event curator.
You receive raw event data from a ticketing API and must:
1. Determine if each event is suitable for children aged 0-18.
2. For suitable events, extract and normalise the following fields:
   - title (string)
   - description (string, 1-2 sentences, family-friendly)
   - venue (string)
   - date (ISO 8601 datetime string)
   - ageMin (integer, default 0)
   - ageMax (integer, default 18)
   - category: one of 'sports'|'arts'|'education'|'outdoor'|'other'
   - imageUrl (string, optional)
   - ticketUrl (string, optional)

Return a JSON array of normalised events. If an event is NOT suitable for children, exclude it.
Output ONLY valid JSON. No markdown, no explanation.`

/**
 * Uses the LLM to filter and normalise raw events for a given city.
 * Falls back to basic heuristic normalisation if LLM call fails.
 */
export async function curateEvents(
  rawEvents: RawEvent[],
  city: string
): Promise<Omit<KidsEvent, 'id' | 'createdAt' | 'updatedAt'>[]> {
  if (!rawEvents.length) return []

  // Prepare compact event summaries for the LLM (token-efficient)
  const summaries = rawEvents.slice(0, 30).map((e, i) => ({
    index: i,
    title:       e.name ?? e.title ?? 'Unknown',
    description: (e.description ?? '').slice(0, 300),
    url:         e.url ?? '',
    date:        e.dates?.start?.dateTime ?? e.dates?.start?.localDate ?? '',
    venue:       e._embedded?.venues?.[0]?.name ?? '',
    imageUrl:    e.images?.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? '',
    segment:     e.classifications?.[0]?.segment?.name ?? '',
    genre:       e.classifications?.[0]?.genre?.name ?? ''
  }))

  const userPrompt = `City: ${city}\n\nRaw events:\n${JSON.stringify(summaries, null, 2)}`

  try {
    const llmResponse = await askOnce(`${SYSTEM_PROMPT}\n\n${userPrompt}`)

    // Parse JSON response (strip potential markdown code fences)
    const jsonStr = llmResponse
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim()

    const parsed = JSON.parse(jsonStr) as Array<{
      title: string
      description: string
      venue: string
      date: string
      ageMin?: number
      ageMax?: number
      category?: string
      imageUrl?: string
      ticketUrl?: string
    }>

    return parsed.map(e => ({
      title:       e.title ?? 'Event',
      description: e.description ?? '',
      city,
      venue:       e.venue ?? '',
      date:        new Date(e.date || Date.now() + 86400000),
      ageMin:      e.ageMin ?? 0,
      ageMax:      e.ageMax ?? 18,
      category:    validateCategory(e.category),
      imageUrl:    e.imageUrl,
      ticketUrl:   e.ticketUrl,
      source:      'ticketmaster'
    }))
  } catch {
    // Fallback: basic heuristic normalisation without LLM
    console.error('[CuratorAgent] LLM call failed, using heuristic fallback')
    return heuristicNormalise(rawEvents, city)
  }
}

/** Maps genre/segment text to an EventCategory. */
function genreToCategory(genre: string): EventCategory {
  const g = genre.toLowerCase()
  if (/sport|football|soccer|swim|gym|cricket|tennis|basketball|rugby/.test(g)) return 'sports'
  if (/art|craft|paint|draw|music|sing|dance|theatre|theater|circus/.test(g)) return 'arts'
  if (/learn|education|workshop|class|science|coding|stem/.test(g)) return 'education'
  if (/outdoor|park|garden|nature|hike|adventure|camping/.test(g)) return 'outdoor'
  return 'other'
}

/** Basic heuristic normalisation when LLM is unavailable. */
function heuristicNormalise(
  rawEvents: RawEvent[],
  city: string
): Omit<KidsEvent, 'id' | 'createdAt' | 'updatedAt'>[] {
  const KIDS_KEYWORDS = ['kids', 'children', 'family', 'youth', 'junior', 'teen', 'school', 'toddler', 'baby']
  return rawEvents
    .filter(e => {
      const text = `${e.name ?? ''} ${e.description ?? ''} ${e.classifications?.[0]?.genre?.name ?? ''}`.toLowerCase()
      return KIDS_KEYWORDS.some(kw => text.includes(kw))
    })
    .map(e => {
      const genre   = e.classifications?.[0]?.genre?.name ?? ''
      const segment = e.classifications?.[0]?.segment?.name ?? ''
      const category = genreToCategory(`${genre} ${segment}`)

      return {
        title:       e.name ?? e.title ?? 'Kids Event',
        description: (e.description ?? 'A fun event for the whole family.').slice(0, 500),
        city,
        venue:       e._embedded?.venues?.[0]?.name ?? 'Venue TBC',
        date:        new Date(e.dates?.start?.dateTime ?? e.dates?.start?.localDate ?? Date.now() + 86400000),
        ageMin:      0,
        ageMax:      18,
        category,
        imageUrl:    e.images?.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url,
        ticketUrl:   e.url,
        source:      'ticketmaster'
      }
    })
}

function validateCategory(cat?: string): EventCategory {
  const valid: EventCategory[] = ['sports', 'arts', 'education', 'outdoor', 'other']
  return valid.includes(cat as EventCategory) ? (cat as EventCategory) : 'other'
}
