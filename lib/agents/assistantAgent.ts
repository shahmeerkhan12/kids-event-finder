/**
 * Agent 2 — Parent Assistant Agent.
 *
 * Handles natural-language chat from parents.
 * Uses RAG: extract intent → query SQLite → inject events as context → LLM response.
 */
import { askMultiTurn } from './deployai'
import type { KidsEvent, ChatMessage, EventFilters, EventCategory } from '../types'

const SYSTEM_PROMPT = `You are a friendly and helpful assistant for parents looking for kids' events.
Your role is to help parents find fun, age-appropriate activities and events for their children.

When a parent asks for events:
1. Extract: city, child age (or age range), category preference, and date preference from their message.
2. You will be provided with relevant events from our database as context.
3. Recommend the most relevant events in a warm, enthusiastic tone.
4. If no events match, suggest broadening the search criteria.
5. Keep responses concise (2-4 sentences max), friendly, and parent-focused.

You MUST only recommend events provided in the context. Do not invent events.`

export interface IntentExtraction {
  city: string
  ageMin?: number
  ageMax?: number
  category?: EventCategory
  dateFrom?: Date
  dateTo?: Date
}

/**
 * Extracts search intent (city, age, category, date) from a parent's message.
 * Falls back to empty filters on parse failure.
 */
export async function extractIntent(
  message: string,
  defaultCity: string
): Promise<IntentExtraction> {
  const prompt = `Extract search parameters from this parent's message and return ONLY valid JSON.

Message: "${message}"

Return JSON with these fields (omit any that are not mentioned):
{
  "city": string (default: "${defaultCity}"),
  "ageMin": number,
  "ageMax": number,
  "category": "sports"|"arts"|"education"|"outdoor"|"other",
  "dateFrom": ISO date string,
  "dateTo": ISO date string
}

Output ONLY the JSON object. No markdown, no explanation.`

  try {
    const raw = await askMultiTurn([{ role: 'user', content: prompt }])
    const jsonStr = raw
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim()
    const parsed = JSON.parse(jsonStr) as IntentExtraction

    return {
      city:     parsed.city ?? defaultCity,
      ageMin:   parsed.ageMin,
      ageMax:   parsed.ageMax,
      category: parsed.category,
      dateFrom: parsed.dateFrom ? new Date(parsed.dateFrom) : undefined,
      dateTo:   parsed.dateTo   ? new Date(parsed.dateTo)   : undefined
    }
  } catch {
    // Fallback: simple regex-based extraction
    return heuristicExtract(message, defaultCity)
  }
}

/**
 * Generates a conversational response given a parent's message,
 * conversation history, and matching events from the DB.
 */
export async function generateResponse(
  message: string,
  history: ChatMessage[],
  events: KidsEvent[]
): Promise<string> {
  const eventsContext = events.length
    ? events
        .slice(0, 5)
        .map(
          (e, i) =>
            `${i + 1}. **${e.title}** — ${e.venue}, ${e.city} | ${e.date.toDateString()} | Ages ${e.ageMin}-${e.ageMax} | Category: ${e.category}`
        )
        .join('\n')
    : 'No matching events found in our database.'

  const messages: { role: string; content: string }[] = [
    { role: 'user', content: SYSTEM_PROMPT },
    // Include prior conversation (last 6 messages for context window efficiency)
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    {
      role: 'user',
      content: `Parent's message: "${message}"\n\nRelevant events from database:\n${eventsContext}\n\nPlease respond helpfully.`
    }
  ]

  try {
    return await askMultiTurn(messages)
  } catch {
    return "I'm sorry, I couldn't find results right now. Please try again in a moment!"
  }
}

/** Simple regex-based intent extraction fallback. */
function heuristicExtract(message: string, defaultCity: string): IntentExtraction {
  const lower = message.toLowerCase()

  // Age extraction: "my 5 year old", "age 3-7", "for 8 year olds"
  const ageMatch = lower.match(/(\d+)\s*(?:year|yr|y\/o|-?\d*\s*year)/)
  const age = ageMatch ? parseInt(ageMatch[1]) : undefined

  // Category keywords
  let category: EventCategory | undefined
  if (/sport|football|soccer|swim|gym|cricket|tennis/i.test(message)) category = 'sports'
  else if (/art|craft|paint|draw|music|sing|dance|theatre/i.test(message)) category = 'arts'
  else if (/learn|workshop|class|science|coding|stem|education/i.test(message)) category = 'education'
  else if (/outdoor|park|garden|nature|hike|adventure/i.test(message)) category = 'outdoor'

  // Date: "this weekend"
  let dateFrom: Date | undefined
  let dateTo: Date | undefined
  if (/this weekend/i.test(message)) {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7
    dateFrom = new Date(now)
    dateFrom.setDate(now.getDate() + daysUntilSat)
    dateTo = new Date(dateFrom)
    dateTo.setDate(dateFrom.getDate() + 1)
  } else if (/today/i.test(message)) {
    dateFrom = new Date()
    dateTo = new Date()
    dateTo.setHours(23, 59, 59)
  }

  return {
    city:     defaultCity,
    ageMin:   age !== undefined ? Math.max(0, age - 1) : undefined,
    ageMax:   age !== undefined ? age + 1 : undefined,
    category,
    dateFrom,
    dateTo
  }
}
