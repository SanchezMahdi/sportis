import { useState } from 'react'
import { Search, SlidersHorizontal, Heart, MapPin, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function IPhoneSpots({ onSelectSpot }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState(new Set(['spot-1']))

  const spots = [
    {
      id: 'spot-1',
      name: 'SOCCER Berliner Tor',
      rating: '4,3',
      category: 'Futsal',
      distance: '5,7 km',
      image: '/iphone/spot_berliner_tor.png',
      address: 'Berliner Tor 11, 20099 Hamburg',
    },
    {
      id: 'spot-2',
      name: 'Bar Wandsbek',
      rating: '4,0',
      category: 'Bar',
      distance: '9,0 km',
      image: '/iphone/spot_bar_wandsbek.png',
      address: 'Wandsbeker Marktstraße 45, Hamburg',
    },
    {
      id: 'spot-3',
      name: 'SOCCER Barmfeld',
      rating: '3,7',
      category: 'Futsal',
      distance: '3,0 km',
      image: '/iphone/spot_barmfeld.png',
      address: 'Barmbeker Straße 12, Hamburg',
    },
  ]

  const toggleFavorite = (id, e) => {
    e.stopPropagation()
    const next = new Set(favorites)
    if (next.has(id)) {
      next.delete(id)
      toast('Aus Favoriten entfernt')
    } else {
      next.add(id)
      toast.success('Zu Favoriten hinzugefügt! ❤️')
    }
    setFavorites(next)
  }

  const filtered = spots.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-20">
      
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 1. Page Title: "Find" + "Your Spots"                               */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-5 pt-2">
        <h1 className="text-3xl font-black text-gray-950 tracking-tight leading-tight">
          Find
        </h1>
        <div className="relative inline-block">
          <span className="text-3xl font-black text-[#6C24B5] tracking-tight">
            Your Spots
          </span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 2. Search Bar with Filter Sliders Icon                             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-4">
        <div className="relative flex items-center bg-white rounded-full border border-gray-200 shadow-sm px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search ...."
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
      {/* 3. Spot Capsule Cards List (Matching Figma Exact)                  */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-4 space-y-4">
        {filtered.map((spot) => {
          const isFav = favorites.has(spot.id)

          return (
            <div
              key={spot.id}
              onClick={() => onSelectSpot && onSelectSpot(spot)}
              className="bg-white rounded-full p-2.5 pr-6 border border-gray-100 shadow-[0_6px_25px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
            >
              {/* Left Circle Image */}
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                <img
                  src={spot.image}
                  alt={spot.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Center Info */}
              <div className="flex-1 px-4">
                <h4 className="text-sm font-bold text-gray-950 tracking-tight">
                  {spot.name}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                  <span>{spot.rating} - {spot.category} - {spot.distance}</span>
                </div>
              </div>

              {/* Right Heart Toggle */}
              <button
                type="button"
                onClick={(e) => toggleFavorite(spot.id, e)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                aria-label="Favorit speichern"
              >
                <Heart
                  className={`w-5 h-5 transition-transform active:scale-125 ${
                    isFav ? 'fill-red-500 text-red-500' : 'text-gray-400 stroke-[1.8]'
                  }`}
                />
              </button>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Keine Spots für "{searchQuery}" gefunden.
          </div>
        )}
      </div>

    </div>
  )
}
