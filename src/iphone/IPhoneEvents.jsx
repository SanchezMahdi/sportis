import { useState } from 'react'
import { Search, SlidersHorizontal, MapPin, Calendar } from 'lucide-react'

export default function IPhoneEvents({ onSelectEvent }) {
  const [selectedCategory, setSelectedCategory] = useState('Ersti Party')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    { id: 'Ersti Party', label: 'Ersti Party', bg: 'bg-[#EDE9FE] text-[#5B3FE9] font-bold ring-1 ring-[#5B3FE9]/20' },
    { id: 'Messe', label: 'Messe', bg: 'bg-[#FEF3C7] text-[#92400E] font-medium' },
    { id: 'Start Up', label: 'Start Up', bg: 'bg-[#FEE2E2] text-[#991B1B] font-medium' },
    { id: 'Theater', label: 'Theater', bg: 'bg-[#D1FAE5] text-[#065F46] font-medium' },
  ]

  const events = [
    {
      id: 'ersti-party',
      title: 'Ersti Party Uni Hamburg',
      location: 'Reeperbahn',
      date: 'November 15 2023',
      price: '7,00 Euro',
      image: '/iphone/event_ersti_party.png',
      category: 'Ersti Party',
    },
    {
      id: 'coldplay',
      title: 'Coldplay : Music of the Spheres',
      location: 'Gelora Bung Karno Stadium..',
      date: 'November 15 2023',
      price: '10 Euro',
      image: '/iphone/event_coldplay.png',
      category: 'Ersti Party',
    },
    {
      id: 'grosse-ersti',
      title: 'Große Ersti Party',
      location: 'Gala Convention Center',
      date: '14 December, 2021',
      price: '$120',
      image: '/iphone/event_details_hero.png',
      category: 'Ersti Party',
    },
  ]

  const filtered = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6 pb-20">
      
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 1. Heading: "Find Your Events" with purple glow                    */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-5 pt-2">
        <h1 className="text-3xl font-black text-gray-950 tracking-tight leading-tight">
          Find
        </h1>
        <div className="relative inline-block">
          <span className="text-3xl font-black text-[#5B3FE9] tracking-tight">
            Your Events
          </span>
          <div className="absolute -inset-x-4 -inset-y-2 bg-[#5B3FE9]/10 rounded-full blur-xl -z-10 pointer-events-none" />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 2. Search Bar                                                      */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-4">
        <div className="relative flex items-center bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search event.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-2 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
          />
          <button
            type="button"
            className="p-1 text-gray-700 hover:text-gray-950 transition-colors"
            title="Filter"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 3. Category Pills (Horizontal scroll)                              */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="px-4 flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-200 shrink-0 shadow-2xs ${
                isSelected
                  ? 'bg-[#EDE9FE] text-[#5B3FE9] font-bold ring-2 ring-[#5B3FE9]/30 scale-[1.02]'
                  : cat.bg + ' opacity-90 hover:opacity-100'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 4. Trending Events Header                                          */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-950 tracking-tight">
          Trending Events
        </h3>
        <button
          type="button"
          className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          See all
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 5. Event Cards List (Clickable to open Event Detail)               */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-4 space-y-5">
        {filtered.map((event) => (
          <div
            key={event.id}
            onClick={() => onSelectEvent && onSelectEvent(event.id)}
            className="relative rounded-3xl overflow-hidden shadow-lg border border-gray-100 cursor-pointer group transition-all duration-300 hover:scale-[1.01]"
          >
            {/* Top Background Image */}
            <div className="h-56 w-full relative overflow-hidden bg-gray-900">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Dark Rounded Badge Overlay (Figma Exact) */}
              <div className="absolute bottom-3 left-3 right-3 bg-[#111322]/85 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between text-white">
                <div className="space-y-1 pr-2">
                  <h4 className="text-sm font-bold tracking-tight text-white leading-tight">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-300 font-medium">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>{event.date}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-gray-400 block font-normal">
                    Start from
                  </span>
                  <span className="text-sm font-extrabold text-white tracking-tight">
                    {event.price}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
