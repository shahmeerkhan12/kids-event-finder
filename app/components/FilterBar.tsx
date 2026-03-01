'use client'
/**
 * FilterBar — age, category, and date filter controls.
 */

export interface Filters {
  ageMin?: number
  ageMax?: number
  category?: string
  dateFrom?: string
  dateTo?: string
}

interface FilterBarProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

const CATEGORIES = [
  { value: '',          label: '🎉 All Categories' },
  { value: 'sports',    label: '⚽ Sports'          },
  { value: 'arts',      label: '🎨 Arts & Culture'  },
  { value: 'education', label: '📚 Education'        },
  { value: 'outdoor',   label: '🌿 Outdoor'          },
  { value: 'other',     label: '✨ Other'             }
]

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const update = (key: keyof Filters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        🔍 Filter Events
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

        {/* Age Min */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Age from</label>
          <input
            type="number"
            min={0} max={18}
            value={filters.ageMin ?? ''}
            onChange={e => update('ageMin', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Age Max */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Age to</label>
          <input
            type="number"
            min={0} max={18}
            value={filters.ageMax ?? ''}
            onChange={e => update('ageMax', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="18"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            value={filters.category ?? ''}
            onChange={e => update('category', e.target.value || undefined)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">From date</label>
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={e => update('dateFrom', e.target.value || undefined)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">To date</label>
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={e => update('dateTo', e.target.value || undefined)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

      </div>

      {/* Clear filters */}
      {(filters.ageMin || filters.ageMax || filters.category || filters.dateFrom || filters.dateTo) && (
        <button
          onClick={() => onChange({})}
          className="mt-3 text-xs text-amber-600 hover:text-amber-800 underline"
        >
          ✕ Clear all filters
        </button>
      )}
    </div>
  )
}
