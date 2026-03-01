/**
 * POST /api/chat
 * Handles Parent Assistant Agent chat messages.
 * Body: { message: string, history?: ChatMessage[], city?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { chat } from '@/lib/services/AssistantService'

const BodySchema = z.object({
  message: z.string().min(1, 'message is required').max(1000),
  history: z
    .array(
      z.object({
        role:    z.enum(['user', 'assistant']),
        content: z.string()
      })
    )
    .optional()
    .default([]),
  city: z.string().optional().default('London')
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { message, history, city } = parsed.data
    const response = await chat(message, history, city)

    // Serialise Date objects in events
    const events = response.events?.map(e => ({
      ...e,
      date:      e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString()
    }))

    return NextResponse.json({
      message: response.message,
      events:  events ?? []
    })
  } catch (err) {
    console.error('[/api/chat] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
