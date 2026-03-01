'use client'
/**
 * EventCard — displays a single kids event as a colourful card.
 */
import Link from 'next/link'

interface EventCardProps {
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

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  sports:    { emoji: '⚽', color: 'bg-green-100 text-green-700',  label: 'Sports'    },
  arts:      { emoji: '🎨', color: 'bg-purple-100 text-purple-700', label: 'Arts'     },
  education: { emoji: '📚', color: 'bg-blue-100 text-blue-700',    label: 'Education' },
  outdoor:   { emoji: '🌿', color: 'bg-emerald-100 text-emerald-700', label: 'Outdoor' },
  other:     { emoji: '🎉', color: 'bg-amber-100 text-amber-700',   label: 'Fun'      }
}

const FALLBACK_IMAGES: Record<string, string> = {
  sports:    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80',
  arts:      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&q=80',
  education: 'https://images.unsplash.com/photo-1532094349884-543559a035d1?w=400&q=80',
  outdoor:   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80',
  other:     'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80'
}

export default function EventCard({
  id, title, description, city, venue, date,
  ageMin, ageMax, category, imageUrl
}: EventCardProps) {
  const cat    = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other
  const imgSrc = imageUrl || FALLBACK_IMAGES[category] || FALLBACK_IMAGES.other
  const dateObj = new Date(date)

  const dayName  = dateObj.toLocaleDateString('en-GB', { weekday: 'short' })
  const dayNum   = dateObj.getDate()
  const monthStr = dateObj.toLocaleDateString('en-GB', { month: 'short' })
  const timeStr  = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <Link href={`/events/${id}`} className="block">
      <article className="event-card bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-100 cursor-pointer">
        {/* Image */}
        <div className="relative h-44 bg-amber-50 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGES.other }}
          />
          {/* Category badge */}
          <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${cat.color}`}>
            {cat.emoji} {cat.label}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-800 text-base leading-snug mb-1 line-clamp-2">{title}</h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-3">{description}</p>

          {/* Date + venue row */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="text-amber-500">📅</span>
            <span>{dayName} {dayNum} {monthStr} · {timeStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <span className="text-amber-500">📍</span>
            <span className="truncate">{venue}, {city}</span>
          </div>

          {/* Age badge */}
          <div className="flex items-center justify-between">
            <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
              👶 Ages {ageMin}–{ageMax}
            </span>
            <span className="text-amber-500 text-sm font-medium">View →</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
