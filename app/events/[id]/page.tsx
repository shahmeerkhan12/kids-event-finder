/**
 * Event detail page — shows full event information.
 */
import { notFound }   from 'next/navigation'
import Link           from 'next/link'

export const dynamic = 'force-dynamic'

interface EventDetail {
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
  ticketUrl?: string
  source: string
}

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; label: string; bg: string }> = {
  sports:    { emoji: '⚽', color: 'text-green-700',   label: 'Sports',     bg: 'bg-green-50'   },
  arts:      { emoji: '🎨', color: 'text-purple-700',  label: 'Arts',       bg: 'bg-purple-50'  },
  education: { emoji: '📚', color: 'text-blue-700',    label: 'Education',  bg: 'bg-blue-50'    },
  outdoor:   { emoji: '🌿', color: 'text-emerald-700', label: 'Outdoor',    bg: 'bg-emerald-50' },
  other:     { emoji: '🎉', color: 'text-amber-700',   label: 'Fun',        bg: 'bg-amber-50'   }
}

const FALLBACK_IMAGES: Record<string, string> = {
  sports:    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  arts:      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&q=80',
  education: 'https://images.unsplash.com/photo-1532094349884-543559a035d1?w=800&q=80',
  outdoor:   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
  other:     'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80'
}

async function getEvent(id: string): Promise<EventDetail | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/events/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json() as EventDetail
  } catch {
    return null
  }
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)
  if (!event) notFound()

  const cat    = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.other
  const imgSrc = event.imageUrl || FALLBACK_IMAGES[event.category] || FALLBACK_IMAGES.other
  const date   = new Date(event.date)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 text-sm mb-6 font-medium">
        ← Back to events
      </Link>

      {/* Hero image */}
      <div className="relative rounded-3xl overflow-hidden h-72 mb-6 shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${cat.bg} ${cat.color}`}>
            {cat.emoji} {cat.label}
          </span>
        </div>
      </div>

      {/* Event card */}
      <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">{event.title}</h1>

        {/* Key info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-amber-50 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">📅</div>
            <p className="text-xs text-gray-500 mb-0.5">Date</p>
            <p className="font-semibold text-sm text-gray-800">
              {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">🕐</div>
            <p className="text-xs text-gray-500 mb-0.5">Time</p>
            <p className="font-semibold text-sm text-gray-800">
              {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
            <div className="text-2xl mb-1">👶</div>
            <p className="text-xs text-gray-500 mb-0.5">Age Range</p>
            <p className="font-semibold text-sm text-gray-800">Ages {event.ageMin}–{event.ageMax}</p>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 rounded-2xl">
          <span className="text-xl mt-0.5">📍</span>
          <div>
            <p className="font-semibold text-gray-800">{event.venue}</p>
            <p className="text-gray-500 text-sm">{event.city}</p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-2">About this event</h2>
          <p className="text-gray-600 leading-relaxed">{event.description}</p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-center py-3 px-6 rounded-2xl font-semibold hover:from-amber-500 hover:to-orange-500 transition-all shadow-md"
            >
              🎟️ Get Tickets
            </a>
          )}
          <Link
            href="/"
            className="flex-1 border-2 border-amber-300 text-amber-700 text-center py-3 px-6 rounded-2xl font-semibold hover:bg-amber-50 transition-colors"
          >
            🔍 Find More Events
          </Link>
        </div>
      </div>
    </div>
  )
}
