/**
 * GET /api/events/[id]
 * Returns a single event by ID.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/lib/services/EventService'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await getEventById(params.id)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...event,
      date:      event.date.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    })
  } catch (err) {
    console.error(`[/api/events/${params.id}] Error:`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
