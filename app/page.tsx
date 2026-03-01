/**
 * Home page — event listing with city selector, filters, and chatbot.
 * Server component: pre-fetches available cities.
 */
import EventsClient from './components/EventsClient'

export const dynamic = 'force-dynamic'

async function getInitialCities(): Promise<string[]> {
  try {
    const res = await fetch('http://localhost:3000/api/events?cities=true', {
      cache: 'no-store'
    })
    if (!res.ok) return []
    const data = await res.json() as { cities?: string[] }
    return data.cities ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const cities = await getInitialCities()
  const defaultCity = cities[0] ?? 'London'

  return (
    <div>
      {/* Hero section */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
          🎈 Find Events for Your Kids
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Discover sports, arts, education, outdoor activities and more — curated by AI just for your little ones!
        </p>
      </div>

      {/* Client-side interactive section */}
      <EventsClient
        initialCities={cities}
        defaultCity={defaultCity}
      />
    </div>
  )
}
