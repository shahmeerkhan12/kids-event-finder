/**
 * GET /api/events
 * Returns filtered kids events from the local DB.
 * Query params: city, ageMin, ageMax, category, dateFrom, dateTo
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getEvents, getAvailableCities } from '@/lib/services/EventService'
import type { EventCategory } from '@/lib/types'

const EventCategoryEnum = z.enum(['sports', 'arts', 'education', 'outdoor', 'other'])

const QuerySchema = z.object({
  city:     z.string().min(1, 'city is required'),
  ageMin:   z.coerce.number().int().min(0).max(18).optional(),
  ageMax:   z.coerce.number().int().min(0).max(18).optional(),
  category: EventCategoryEnum.optional(),
  dateFrom: z.string().optional().transform(s => s ? new Date(s) : undefined),
  dateTo:   z.string().optional().transform(s => s ? new Date(s) : undefined)
})

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries())

    // Special case: return available cities
    if (params.cities === 'true') {
      const cities = await getAvailableCities()
      return NextResponse.json({ cities })
    }

    const parsed = QuerySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const filters = {
      city:     parsed.data.city,
      ageMin:   parsed.data.ageMin,
      ageMax:   parsed.data.ageMax,
      category: parsed.data.category as EventCategory | undefined,
      dateFrom: parsed.data.dateFrom,
      dateTo:   parsed.data.dateTo
    }

    const events = await getEvents(filters)

    // Convert Date objects to ISO strings for JSON serialisation
    const serialised = events.map(e => ({
      ...e,
      date:      e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString()
    }))

    return NextResponse.json({ events: serialised, total: serialised.length })
  } catch (err) {
    console.error('[/api/events] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
