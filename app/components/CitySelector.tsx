'use client'
/**
 * CitySelector — geolocation-assisted or manual city picker.
 */
import { useState } from 'react'

interface CitySelectorProps {
  selectedCity: string
  availableCities: string[]
  onChange: (city: string) => void
}

// Map of UK/US city names to lat/lon for reverse geocoding display
const MAJOR_CITIES = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Edinburgh',
  'Glasgow', 'Bristol', 'Cardiff', 'Liverpool', 'Sheffield',
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'
]

export default function CitySelector({ selectedCity, availableCities, onChange }: CitySelectorProps) {
  const [detecting, setDetecting] = useState(false)
  const [geoError, setGeoError]   = useState('')

  const allCities = Array.from(new Set([...availableCities, ...MAJOR_CITIES])).sort()

  const detectCity = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser.')
      return
    }
    setDetecting(true)
    setGeoError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          )
          const data = await res.json() as { address?: { city?: string; town?: string; village?: string } }
          const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? ''
          if (city) {
            onChange(city)
          } else {
            setGeoError('Could not determine your city.')
          }
        } catch {
          setGeoError('Location lookup failed. Please select manually.')
        } finally {
          setDetecting(false)
        }
      },
      () => {
        setGeoError('Location access denied. Please select your city manually.')
        setDetecting(false)
      },
      { timeout: 8000 }
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full">
          <label className="block text-xs text-gray-500 mb-1 font-medium">📍 City</label>
          <div className="flex gap-2">
            <select
              value={selectedCity}
              onChange={e => onChange(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
            >
              {allCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <button
              onClick={detectCity}
              disabled={detecting}
              title="Detect my location"
              className="px-3 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {detecting ? '⏳' : '🎯'}
            </button>
          </div>

          {geoError && (
            <p className="text-xs text-red-500 mt-1">{geoError}</p>
          )}
        </div>

        <div className="text-xs text-gray-400 hidden sm:block">
          Events shown for <span className="font-semibold text-amber-600">{selectedCity}</span>
        </div>
      </div>
    </div>
  )
}
