/**
 * POST /api/curator/run
 * Manually triggers the Event Curator Agent for one or more cities.
 * Body: { cities?: string[] }  — defaults to CURATOR_TARGET_CITIES env var.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runCurator } from '@/lib/services/CuratorService'
import { logger } from '@/lib/logger'

const BodySchema = z.object({
  cities: z.array(z.string().min(1)).optional()
})

export async function POST(req: NextRequest) {
  try {
    let body: unknown = {}
    try { body = await req.json() } catch { /* empty body is fine */ }

    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const envCities = (process.env.CURATOR_TARGET_CITIES ?? 'London,Manchester,Birmingham')
      .split(',')
      .map(c => c.trim())
      .filter(Boolean)

    const cities = parsed.data.cities?.length ? parsed.data.cities : envCities

    logger.info({ cities }, '[/api/curator/run] Starting manual curator run')

    const results: Record<string, number> = {}
    for (const city of cities) {
      results[city] = await runCurator(city)
    }

    return NextResponse.json({
      success: true,
      results,
      totalUpserted: Object.values(results).reduce((a, b) => a + b, 0)
    })
  } catch (err) {
    console.error('[/api/curator/run] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
