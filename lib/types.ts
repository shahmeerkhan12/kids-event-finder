/**
 * Core domain types for Kids Event Finder.
 */

export type EventCategory = 'sports' | 'arts' | 'education' | 'outdoor' | 'other'

/**
 * Normalized event record stored in SQLite.
 */
export interface KidsEvent {
  id: string
  title: string
  description: string
  city: string
  venue: string
  date: Date
  ageMin: number
  ageMax: number
  category: EventCategory
  imageUrl?: string
  ticketUrl?: string
  source: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Query filters for event listing page.
 */
export interface EventFilters {
  city: string
  ageMin?: number
  ageMax?: number
  category?: EventCategory
  dateFrom?: Date
  dateTo?: Date
}

/**
 * Chat message in the Parent Assistant Agent conversation.
 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Response from the Parent Assistant Agent.
 */
export interface AssistantResponse {
  message: string
  events?: KidsEvent[]
}

/**
 * Row shape as stored/returned from SQLite (dates as ISO strings).
 */
export interface KidsEventRow {
  id: string
  title: string
  description: string
  city: string
  venue: string
  date: string
  age_min: number
  age_max: number
  category: EventCategory
  image_url: string | null
  ticket_url: string | null
  source: string
  created_at: string
  updated_at: string
}
