/**
 * EventRepository — SQLite CRUD operations for KidsEvent records.
 */
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/client'
import type { KidsEvent, KidsEventRow, EventFilters } from '../types'

/** Convert a SQLite row to a KidsEvent domain object. */
function rowToEvent(row: KidsEventRow): KidsEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    city: row.city,
    venue: row.venue,
    date: new Date(row.date),
    ageMin: row.age_min,
    ageMax: row.age_max,
    category: row.category,
    imageUrl: row.image_url ?? undefined,
    ticketUrl: row.ticket_url ?? undefined,
    source: row.source,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }
}

/**
 * Upserts a normalized event into SQLite.
 * Matches on (title, city, date) for deduplication.
 */
export async function upsertEvent(
  event: Omit<KidsEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<KidsEvent> {
  const db = getDb()
  const now = new Date().toISOString()

  // Deduplicate by title + city + date (date part only, ignoring time)
  const datePart = event.date.toISOString().slice(0, 10) // YYYY-MM-DD
  const existing = db
    .prepare<[string, string, string]>(
      "SELECT id FROM events WHERE title = ? AND city = ? AND substr(date, 1, 10) = ?"
    )
    .get(event.title, event.city, datePart) as { id: string } | undefined

  const id = existing?.id ?? uuidv4()

  db.prepare(`
    INSERT INTO events (id, title, description, city, venue, date, age_min, age_max,
                        category, image_url, ticket_url, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title       = excluded.title,
      description = excluded.description,
      venue       = excluded.venue,
      date        = excluded.date,
      age_min     = excluded.age_min,
      age_max     = excluded.age_max,
      category    = excluded.category,
      image_url   = excluded.image_url,
      ticket_url  = excluded.ticket_url,
      source      = excluded.source,
      updated_at  = excluded.updated_at
  `).run(
    id,
    event.title,
    event.description,
    event.city,
    event.venue,
    event.date.toISOString(),
    event.ageMin,
    event.ageMax,
    event.category,
    event.imageUrl ?? null,
    event.ticketUrl ?? null,
    event.source,
    existing ? undefined : now, // preserve original created_at on update
    now
  )

  // Re-fetch to get persisted record
  const row = db
    .prepare<[string]>('SELECT * FROM events WHERE id = ?')
    .get(id) as KidsEventRow

  return rowToEvent(row)
}

/**
 * Queries events matching the given filters, ordered by date ascending.
 * Only returns future (or today's) events.
 */
export async function queryEvents(filters: EventFilters): Promise<KidsEvent[]> {
  const db = getDb()
  const conditions: string[] = ['city = ?']
  const params: unknown[] = [filters.city]

  const now = new Date().toISOString()
  conditions.push('date >= ?')
  params.push(now)

  if (filters.ageMin !== undefined) {
    conditions.push('age_max >= ?')
    params.push(filters.ageMin)
  }
  if (filters.ageMax !== undefined) {
    conditions.push('age_min <= ?')
    params.push(filters.ageMax)
  }
  if (filters.category) {
    conditions.push('category = ?')
    params.push(filters.category)
  }
  if (filters.dateFrom) {
    conditions.push('date >= ?')
    params.push(filters.dateFrom.toISOString())
  }
  if (filters.dateTo) {
    conditions.push('date <= ?')
    params.push(filters.dateTo.toISOString())
  }

  const sql = `
    SELECT * FROM events
    WHERE ${conditions.join(' AND ')}
    ORDER BY date ASC
    LIMIT 100
  `

  const rows = db.prepare(sql).all(...params) as KidsEventRow[]
  return rows.map(rowToEvent)
}

/**
 * Retrieves a single event by ID.
 */
export async function getEventById(id: string): Promise<KidsEvent | null> {
  const db = getDb()
  const row = db
    .prepare<[string]>('SELECT * FROM events WHERE id = ?')
    .get(id) as KidsEventRow | undefined
  return row ? rowToEvent(row) : null
}

/**
 * Returns distinct cities that have upcoming events.
 */
export async function getAvailableCities(): Promise<string[]> {
  const db = getDb()
  const now = new Date().toISOString()
  const rows = db
    .prepare("SELECT DISTINCT city FROM events WHERE date >= ? ORDER BY city ASC")
    .all(now) as { city: string }[]
  return rows.map(r => r.city)
}
