/**
 * AssistantService — RAG-powered chat for the Parent Assistant Agent.
 * Extract intent → query SQLite → inject as context → LLM response.
 */
import * as EventRepo   from '../repositories/EventRepository'
import { extractIntent, generateResponse } from '../agents/assistantAgent'
import type { ChatMessage, AssistantResponse } from '../types'

/**
 * Processes a parent's chat message using RAG + LLM.
 * @param message - Parent's natural language query
 * @param history - Prior conversation messages for context
 * @param defaultCity - City to use when none is mentioned in the message
 */
export async function chat(
  message: string,
  history: ChatMessage[],
  defaultCity: string = 'London'
): Promise<AssistantResponse> {
  // Step 1: Extract intent (city, age, category, date) from message
  const intent = await extractIntent(message, defaultCity)

  // Step 2: Query matching events from SQLite (RAG retrieval)
  const events = await EventRepo.queryEvents({
    city:     intent.city,
    ageMin:   intent.ageMin,
    ageMax:   intent.ageMax,
    category: intent.category,
    dateFrom: intent.dateFrom,
    dateTo:   intent.dateTo
  })

  // Step 3: Generate LLM response with events as context
  const responseText = await generateResponse(message, history, events)

  return {
    message: responseText,
    events:  events.slice(0, 5) // Return up to 5 referenced events
  }
}
