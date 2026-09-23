import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Users, Calendar, Clock, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const figmaSessions = [
  {
    id: 'soccer-1',
    sport: 'Soccer',
    title: 'Soccer',
    subtitle: 'Playing soccer This Weekend',
    time: '18:00',
    location: 'Hamburg',
    members: '5/5',
    date: '12.02.2026',
    image: '/figma/sports_soccer.png',
    isIllustration: true,
  },
  {
    id: 'basketball-1',
    sport: 'Basketball',
    title: 'Basketball',
    subtitle: 'Playing Basketball BWL',
    time: '17:00',
    location: 'Hamburg',
    members: '3/5',
    date: '12.02.2026',
    image: '/figma/sports_basketball.png',
    isIllustration: true,
  },
  {
    id: 'skating-1',
    sport: 'Skating',
    title: 'Skating',
    subtitle: 'Skating with friends',
    time: '17:00',
    location: 'Hamburg',
    members: '9/10',
    date: '12.02.2026',
    image: '/figma/sports_skating.png',
    isIllustration: true,
  },
  {
    id: 'horse-1',
    sport: 'Reiten',
    title: 'Reiten',
    subtitle: 'Ausreiten im Volkspark',
    time: '15:30',
    location: 'Hamburg',
    members: '4/6',
    date: '14.02.2026',
    image: '/figma/sports_horse.png',
    isIllustration: true,
  },
  {
    id: 'bar-1',
    sport: 'Bar',
    title: 'Bar',
    subtitle: 'Karaoke',
    time: '17:00',
    location: 'Hamburg',
    members: '10/10',
    date: '12.02.2026',
    image: '/figma/session_bar_photo.png',
    isIllustration: false,
  },
]

export default function Sessions() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [locationInput, setLocationInput] = useState('')
  const [umkreisInput, setUmkreisInput] = useState('')
  const [dateInput, setDateInput] = useState('')

  const [joinedSet, setJoinedSet] = useState(new Set())

  const handleJoin = (sessionId, title) => {
    if (!user) {
      toast.error('Bitte melde dich an, um beizutreten.')
      navigate('/login')
      return
    }
    setJoinedSet((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
        toast('Du hast die Session verlassen')
      } else {
        next.add(sessionId)
        toast.success(`Erfolgreich beigetreten für "${title}"! 🎉`)
      }
      return next
    })
  }

  // Filter figma sessions by search input
  const filteredSessions = figmaSessions.filter((s) => {
    if (locationInput && !s.location.toLowerCase().includes(locationInput.toLowerCase())) {
      return false
    }
    if (dateInput && !s.date.includes(dateInput)) {
      return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-[#FDFDFE] text-gray-900 font-['Inter',sans-serif] pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 1. TOP FIGMA BANNER ("Find Your Community by joing Session")        */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm mb-6 select-none">
          <img 
            src="/figma/sessions_community_banner.png" 
            alt="Find Your Community by joing Session" 
            className="w-full h-auto object-cover" 
          />
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 2. "SESSION ERSTELLEN" ACTION BUTTON (Black Pill with Blue Arrow)  */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="flex justify-end mb-6">
          <Link
            to="/session/erstellen"
            className="inline-flex items-center gap-3 bg-[#0B0D17] hover:bg-gray-900 text-white text-sm font-semibold pl-6 pr-2 py-2 rounded-full shadow-sm hover:shadow-md transition-all group"
          >
            <span>Session erstellen</span>
            <div className="w-8 h-8 rounded-full bg-[#2F80ED] flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 3. SEARCH & FILTER BAR                                             */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-3 sm:p-4 shadow-sm mb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Location input */}
            <div className="md:col-span-4 flex items-center gap-3 px-3 py-2 border-b md:border-b-0 md:border-r border-gray-100">
              <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Location"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
              />
            </div>

            {/* Umkreis input */}
            <div className="md:col-span-3 flex items-center gap-3 px-3 py-2 border-b md:border-b-0 md:border-r border-gray-100">
              <Users className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Umkreis"
                value={umkreisInput}
                onChange={(e) => setUmkreisInput(e.target.value)}
                className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
              />
            </div>

            {/* Date input */}
            <div className="md:col-span-3 flex items-center gap-3 px-3 py-2 border-b md:border-b-0 md:border-r border-gray-100">
              <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
              />
            </div>

            {/* Search button */}
            <div className="md:col-span-2">
              <button
                type="button"
                className="w-full bg-[#2F80ED] hover:bg-[#2563EB] text-white font-medium text-sm py-3 px-6 rounded-xl transition-colors shadow-xs"
              >
                Search
              </button>
            </div>

          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 4. FIGMA 4 CARDS (Soccer, Basketball, Skating, Bar)                */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
          {filteredSessions.map((s) => {
            const isJoined = joinedSet.has(s.id)

            return (
              <div
                key={s.id}
                className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center justify-between group"
              >
                {/* Visual / Image area */}
                <div className={`w-full h-44 flex items-center justify-center overflow-hidden rounded-2xl mb-4 ${s.isIllustration ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                  {s.isIllustration ? (
                    <img
                      src={s.image}
                      alt={s.title}
                      className="max-h-40 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>

                {/* Card Title & Subtitle */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-950 mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {s.subtitle}
                  </p>
                </div>

                {/* Details (2x2 grid with Clock, MapPin, Users, Calendar) */}
                <div className="w-full grid grid-cols-2 gap-3 text-xs text-gray-600 mb-6 px-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{s.time}</span>
                  </div>

                  <div className="flex items-center gap-1.5 justify-end">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{s.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{s.members}</span>
                  </div>

                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{s.date}</span>
                  </div>
                </div>

                {/* Join Button (Black Pill or Green when joined) */}
                <button
                  type="button"
                  onClick={() => handleJoin(s.id, s.title)}
                  className={`w-full py-2.5 px-6 rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    isJoined
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-[#0B0D17] hover:bg-black text-white hover:shadow-md'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Joined</span>
                    </>
                  ) : (
                    <span>Join</span>
                  )}
                </button>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
