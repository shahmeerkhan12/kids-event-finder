'use client'
/**
 * EventsClient — client-side event listing with filters.
 * Fetches events from /api/events on filter/city change.
 */
import { useState, useEffect, useCallback } from 'react'
import EventCard    from './EventCard'
import FilterBar    from './FilterBar'
import CitySelector from './CitySelector'
import ChatWidget   from './ChatWidget'
import type { Filters } from './FilterBar'

interface EventItem {
  id: string
  title: string
  description: string
  city: string
  venue: string
  date: string
  ageMin: number
  ageMax: number
  category: string
  imageUrl?: string
}

interface EventsClientProps {
  initialCities: string[]
  defaultCity: string
}

export default function EventsClient({ initialCities, defaultCity }: EventsClientProps) {
  const [city,    setCity]    = useState(defaultCity)
  const [filters, setFilters] = useState<Filters>({})
  const [events,  setEvents]  = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [seeded,  setSeeded]  = useState(false)

  const fetchEvents = useCallback(async (c: string, f: Filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ city: c })
      if (f.ageMin !== undefined) params.set('ageMin', String(f.ageMin))
      if (f.ageMax !== undefined) params.set('ageMax', String(f.ageMax))
      if (f.category)             params.set('category', f.category)
      if (f.dateFrom)             params.set('dateFrom', f.dateFrom)
      if (f.dateTo)               params.set('dateTo', f.dateTo)

      const res  = await fetch(`/api/events?${params}`)
      const data = await res.json() as { events?: EventItem[] }
      setEvents(data.events ?? [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Seed DB with mock events on first load
  const seedEvents = useCallback(async () => {
    if (seeded) return
    setSeeded(true)
    try {
      await fetch('/api/curator/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cities: [defaultCity, 'London', 'Manchester', 'New York'] })
      })
    } catch { /* silent */ }
  }, [seeded, defaultCity])

  useEffect(() => {
    seedEvents().then(() => fetchEvents(city, filters))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchEvents(city, filters)
  }, [city, filters, fetchEvents])

  const handleCityChange = (newCity: string) => {
    setCity(newCity)
  }

  return (
    <>
      {/* City selector */}
      <CitySelector
        selectedCity={city}
        availableCities={initialCities}
        onChange={handleCityChange}
      />

      {/* Filter bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-100 animate-pulse">
              <div className="h-44 bg-amber-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-amber-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎪</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No events found</h3>
          <p className="text-gray-400 max-w-sm mx-auto">
            Try adjusting your filters or selecting a different city. New events are added every 6 hours!
          </p>
          <button
            onClick={() => setFilters({})}
            className="mt-4 px-4 py-2 bg-amber-400 text-white rounded-xl text-sm font-medium hover:bg-amber-500 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-amber-600">{events.length}</span> events in{' '}
              <span className="font-semibold">{city}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {events.map(event => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        </>
      )}

      {/* Floating chatbot */}
      <ChatWidget city={city} />
    </>
  )
}
