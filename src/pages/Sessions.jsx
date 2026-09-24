import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Users, Calendar, Clock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const getSportIllustration = (sport) => {
  const s = (sport || '').toLowerCase()
  if (s.includes('fuss') || s.includes('foot') || s.includes('soccer')) {
    return '/figma/sports_soccer.png'
  }
  if (s.includes('basket')) {
    return '/figma/sports_basketball.png'
  }
  if (s.includes('skat')) {
    return '/figma/sports_skating.png'
  }
  if (s.includes('reit') || s.includes('horse') || s.includes('pferd')) {
    return '/figma/sports_horse.png'
  }
  if (s.includes('bar') || s.includes('karaoke')) {
    return '/figma/session_bar_photo.png'
  }
  return '/figma/sports_soccer.png'
}

const formatDate = (dateStr, scheduledAt) => {
  if (dateStr) {
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`
    return dateStr
  }
  if (scheduledAt) {
    try {
      const d = new Date(scheduledAt)
      return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
    } catch {
      return ''
    }
  }
  return '12.02.2026'
}

const formatTime = (timeStr, scheduledAt) => {
  if (timeStr) {
    const parts = timeStr.split(':')
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
    return timeStr
  }
  if (scheduledAt) {
    try {
      const d = new Date(scheduledAt)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    } catch {
      return ''
    }
  }
  return '18:00'
}

// Canonical Figma Showcase Sessions (matching Bildschirmfoto 2026-09-24 um 12.25.53.png)
const FIGMA_CARDS = [
  {
    id: 'figma-soccer',
    sport: 'Soccer',
    sportDisplay: 'Soccer',
    title: 'Playing soccer This Weekend',
    timeDisplay: '18:00',
    locationDisplay: 'Hamburg',
    spotsDisplay: '5/5',
    dateDisplay: '12.02.2026',
    illustration: '/figma/sports_soccer.png',
    isBar: false,
  },
  {
    id: 'figma-basketball',
    sport: 'Basketball',
    sportDisplay: 'Basketball',
    title: 'Playing Basketball BWL',
    timeDisplay: '17:00',
    locationDisplay: 'Hamburg',
    spotsDisplay: '3/5',
    dateDisplay: '12.02.2026',
    illustration: '/figma/sports_basketball.png',
    isBar: false,
  },
  {
    id: 'figma-skating',
    sport: 'Skating',
    sportDisplay: 'Skating',
    title: 'Skating with friends',
    timeDisplay: '17:00',
    locationDisplay: 'Hamburg',
    spotsDisplay: '9/10',
    dateDisplay: '12.02.2026',
    illustration: '/figma/sports_skating.png',
    isBar: false,
  },
  {
    id: 'figma-bar',
    sport: 'Bar',
    sportDisplay: 'Bar',
    title: 'Karraoke',
    timeDisplay: '17:00',
    locationDisplay: 'Hamburg',
    spotsDisplay: '10/10',
    dateDisplay: '12.02.2026',
    illustration: '/figma/session_bar_photo.png',
    isBar: true,
  },
]

export default function Sessions() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [dbSessions, setDbSessions] = useState([])
  const [joinedIds, setJoinedIds] = useState(new Set())

  const [locationInput, setLocationInput] = useState('')
  const [umkreisInput, setUmkreisInput] = useState('')
  const [dateInput, setDateInput] = useState('')

  // Fetch real sessions created by real people in Supabase
  const fetchRealSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, session_participants(user_id)')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setDbSessions(data)
      }
    } catch (err) {
      console.error('Fehler beim Laden der Sessions:', err)
    }
  }, [])

  useEffect(() => {
    fetchRealSessions()

    const channel = supabase
      .channel('sessions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchRealSessions()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_participants' }, () => {
        fetchRealSessions()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRealSessions])

  const handleJoin = async (session) => {
    if (!user) {
      toast.error('Bitte melde dich an, um beizutreten.')
      navigate('/login')
      return
    }

    if (session.realSessionId) {
      const isAlreadyJoined = session.isJoined
      try {
        if (isAlreadyJoined) {
          await supabase
            .from('session_participants')
            .delete()
            .eq('session_id', session.realSessionId)
            .eq('user_id', user.id)
          toast('Du hast die Session verlassen')
        } else {
          await supabase
            .from('session_participants')
            .upsert(
              { session_id: session.realSessionId, user_id: user.id, waitlist: false, attended: true },
              { onConflict: 'session_id,user_id' }
            )
          toast.success('Erfolgreich beigetreten! 🎉')
        }
        fetchRealSessions()
      } catch (err) {
        console.error(err)
        toast.error('Fehler beim Beitreten.')
      }
    } else {
      // Local toggle for showcase sessions
      const next = new Set(joinedIds)
      if (next.has(session.id)) {
        next.delete(session.id)
        toast('Du hast die Session verlassen')
      } else {
        next.add(session.id)
        toast.success('Erfolgreich beigetreten! 🎉')
      }
      setJoinedIds(next)
    }
  }

  const normalizeSport = (sport = '') => {
    const s = sport.toLowerCase()
    if (s.includes('fuss') || s.includes('foot') || s.includes('soccer')) return 'Soccer'
    if (s.includes('basket')) return 'Basketball'
    if (s.includes('skat')) return 'Skating'
    if (s.includes('bar') || s.includes('karaoke')) return 'Bar'
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  // Map DB sessions to the exact Figma card format
  const mappedDbSessions = dbSessions.map((s) => {
    const isJoined = s.session_participants?.some((p) => p.user_id === user?.id)
    const normalized = normalizeSport(s.sport)
    const isBar = normalized === 'Bar'

    return {
      id: s.id,
      realSessionId: s.id,
      sport: normalized,
      sportDisplay: normalized,
      title: s.title,
      timeDisplay: formatTime(s.time, s.scheduled_at),
      locationDisplay: s.location || s.location_name || s.address || 'Hamburg',
      spotsDisplay: `${s.session_participants?.length || 1}/${s.max_players || 10}`,
      dateDisplay: formatDate(s.date, s.scheduled_at),
      illustration: getSportIllustration(s.sport),
      isBar,
      isJoined,
    }
  })

  // Combine DB sessions + Figma showcase cards in canonical order: Soccer, Basketball, Skating, Bar
  const order = ['Soccer', 'Basketball', 'Skating', 'Bar']
  const combined = [
    ...mappedDbSessions,
    ...FIGMA_CARDS.filter(
      (fc) => !mappedDbSessions.some((db) => db.sport.toLowerCase() === fc.sport.toLowerCase())
    ),
  ]

  const allCards = combined.sort((a, b) => {
    const idxA = order.indexOf(a.sportDisplay)
    const idxB = order.indexOf(b.sportDisplay)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return 0
  })

  // Filter based on Location, Umkreis, Date search inputs
  const filteredSessions = allCards.filter((c) => {
    if (locationInput) {
      const locText = `${c.locationDisplay} ${c.title}`.toLowerCase()
      if (!locText.includes(locationInput.toLowerCase().trim())) return false
    }
    if (umkreisInput) {
      const umkText = `${c.locationDisplay} ${c.title}`.toLowerCase()
      if (!umkText.includes(umkreisInput.toLowerCase().trim())) return false
    }
    if (dateInput) {
      const dText = `${c.dateDisplay}`.toLowerCase()
      if (!dText.includes(dateInput.toLowerCase().trim())) return false
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
            className="inline-flex items-center gap-3 bg-[#0B0D17] hover:bg-black text-white text-sm font-semibold pl-6 pr-2 py-2 rounded-full shadow-sm hover:shadow-md transition-all group"
          >
            <span>Session erstellen</span>
            <div className="w-8 h-8 rounded-full bg-[#2F80ED] flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 3. SEARCH & FILTER BAR (Matching Figma Exact)                      */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-2 sm:p-2.5 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
            
            {/* Location input */}
            <div className="md:col-span-4 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
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
            <div className="md:col-span-3 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
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
            <div className="md:col-span-3 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
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
                onClick={fetchRealSessions}
                className="w-full h-12 md:h-14 bg-[#2F80ED] hover:bg-[#2563EB] text-white font-medium text-base rounded-xl md:rounded-2xl transition-colors shadow-xs flex items-center justify-center"
              >
                Search
              </button>
            </div>

          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 4. SESSIONS CARDS (4-Column Grid matching Figma Exact)             */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {filteredSessions.map((s) => {
            const isJoined = s.isJoined || joinedIds.has(s.id)
            const detailUrl = s.realSessionId ? `/session/${s.realSessionId}` : '/session/erstellen'

            return (
              <div
                key={s.id}
                className="bg-white rounded-[32px] sm:rounded-[36px] border border-gray-100/90 shadow-[0_10px_35px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 p-6 sm:p-7 flex flex-col items-center justify-between group"
              >
                {/* Top Image area */}
                <Link
                  to={detailUrl}
                  className="w-full h-44 sm:h-48 flex items-center justify-center mb-3 select-none"
                >
                  {s.isBar ? (
                    <div className="w-full h-full overflow-hidden rounded-t-[32px] rounded-b-xl flex items-center justify-center">
                      <img
                        src="/figma/session_bar_photo.png"
                        alt={s.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <img
                      src={s.illustration || getSportIllustration(s.sport)}
                      alt={s.title}
                      className="max-h-40 sm:max-h-44 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </Link>

                {/* Card Title & Subtitle */}
                <div className="text-center mb-2 w-full">
                  <Link to={detailUrl}>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight hover:text-[#2F80ED] transition-colors">
                      {s.sportDisplay}
                    </h3>
                  </Link>
                  <p className="text-xs sm:text-sm font-normal text-gray-700 mt-1 line-clamp-1 px-1">
                    {s.title}
                  </p>
                </div>

                {/* Details (2x2 grid with Clock, MapPin, Users, Calendar) */}
                <div className="w-full grid grid-cols-2 gap-x-3 gap-y-2 text-xs font-medium text-gray-700 mt-4 mb-6 px-1">
                  <div className="flex items-center gap-1.5" title="Uhrzeit">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{s.timeDisplay}</span>
                  </div>

                  <div className="flex items-center gap-1.5" title="Ort">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{s.locationDisplay}</span>
                  </div>

                  <div className="flex items-center gap-1.5" title="Teilnehmer:innen">
                    <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{s.spotsDisplay}</span>
                  </div>

                  <div className="flex items-center gap-1.5" title="Datum">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{s.dateDisplay}</span>
                  </div>
                </div>

                {/* Black Pill Action Button: "Join" */}
                <button
                  type="button"
                  onClick={() => handleJoin(s)}
                  className={`w-full py-2.5 rounded-full font-semibold text-sm transition-all shadow-xs ${
                    isJoined
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-[#0B0D17] hover:bg-black text-white'
                  }`}
                >
                  {isJoined ? 'Beigetreten' : 'Join'}
                </button>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
