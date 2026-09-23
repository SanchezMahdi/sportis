import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Users, Calendar, Clock, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react'
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
  return 'Termin offen'
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

export default function Sessions() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const [locationInput, setLocationInput] = useState('')
  const [umkreisInput, setUmkreisInput] = useState('')
  const [dateInput, setDateInput] = useState('')

  // Fetch real sessions created by real people from Supabase
  const fetchRealSessions = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sessions')
        .select('*, session_participants(user_id)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fehler beim Laden der Sessions:', error)
      } else {
        setSessions(data || [])
      }
    } catch (err) {
      console.error('Fehler:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRealSessions()

    // Realtime channel: update automatically when real users create or join sessions
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

  const handleJoin = async (s) => {
    if (!user) {
      toast.error('Bitte melde dich an, um beizutreten.')
      navigate('/login')
      return
    }

    const isJoined = s.session_participants?.some((p) => p.user_id === user.id)

    try {
      if (isJoined) {
        const { error } = await supabase
          .from('session_participants')
          .delete()
          .eq('session_id', s.id)
          .eq('user_id', user.id)

        if (error) throw error
        toast('Du hast die Session verlassen')
      } else {
        const { error } = await supabase
          .from('session_participants')
          .upsert(
            { session_id: s.id, user_id: user.id, waitlist: false, attended: true },
            { onConflict: 'session_id,user_id' }
          )

        if (error) throw error
        toast.success(`Erfolgreich beigetreten für "${s.title}"! 🎉`)
      }
      fetchRealSessions()
    } catch (err) {
      console.error(err)
      toast.error('Aktion fehlgeschlagen: ' + (err?.message || ''))
    }
  }

  // Filter real sessions based on category, location, and date
  const filteredSessions = sessions.filter((s) => {
    // Category filter
    if (selectedCategory !== 'Alle') {
      const sportLower = (s.sport || '').toLowerCase()
      const titleLower = (s.title || '').toLowerCase()

      if (selectedCategory === 'Soccer') {
        const isSoccer = sportLower.includes('fuss') || sportLower.includes('foot') || sportLower.includes('soccer') || titleLower.includes('fußball') || titleLower.includes('soccer')
        if (!isSoccer) return false
      } else if (selectedCategory === 'Basketball') {
        const isBasket = sportLower.includes('basket') || titleLower.includes('basketball')
        if (!isBasket) return false
      } else if (selectedCategory === 'Skating') {
        const isSkate = sportLower.includes('skat') || titleLower.includes('skating')
        if (!isSkate) return false
      } else if (selectedCategory === 'Andere') {
        const isCommon = sportLower.includes('fuss') || sportLower.includes('foot') || sportLower.includes('soccer') || sportLower.includes('basket') || sportLower.includes('skat')
        if (isCommon) return false
      }
    }

    // Location search
    if (locationInput) {
      const locText = `${s.location || ''} ${s.location_name || ''} ${s.address || ''}`.toLowerCase()
      if (!locText.includes(locationInput.toLowerCase())) {
        return false
      }
    }

    // Umkreis / radius text
    if (umkreisInput) {
      const locText = `${s.location || ''} ${s.location_name || ''} ${s.address || ''}`.toLowerCase()
      if (!locText.includes(umkreisInput.toLowerCase())) {
        return false
      }
    }

    // Date search
    if (dateInput) {
      const dateText = `${s.date || ''} ${s.scheduled_at || ''}`
      if (!dateText.includes(dateInput)) {
        return false
      }
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
        <div className="bg-white rounded-2xl border border-gray-200/80 p-3 sm:p-4 shadow-sm mb-6">
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
                onClick={fetchRealSessions}
                className="w-full bg-[#2F80ED] hover:bg-[#2563EB] text-white font-medium text-sm py-3 px-6 rounded-xl transition-colors shadow-xs"
              >
                Search
              </button>
            </div>

          </div>
        </div>

        {/* Category Pills (Soccer, Basketball, Skating, Andere, Alle) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {['Alle', 'Soccer', 'Basketball', 'Skating', 'Andere'].map((cat) => {
            const active = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#0B0D17] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 4. REAL SESSIONS GRID (Created by real users in Supabase)          */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#2F80ED] mb-3" />
            <p className="text-sm font-medium">Lade echte Sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center max-w-xl mx-auto shadow-sm my-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2F80ED] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-950 mb-2">
              Keine Sessions gefunden
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Es gibt aktuell keine aktiven Sessions für diese Auswahl. Erstelle jetzt die erste echte Session und lade deine Freunde ein!
            </p>
            <Link
              to="/session/erstellen"
              className="inline-flex items-center gap-2 bg-[#2F80ED] hover:bg-[#2563EB] text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-colors"
            >
              <span>Jetzt Session erstellen</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
            {filteredSessions.map((s) => {
              const isJoined = s.session_participants?.some((p) => p.user_id === user?.id)
              const illustration = getSportIllustration(s.sport)
              const formattedDate = formatDate(s.date, s.scheduled_at)
              const formattedTime = formatTime(s.time, s.scheduled_at)
              const loc = s.location || s.location_name || s.address || 'Hamburg'
              const participantCount = s.session_participants?.length || 0
              const maxPlayers = s.max_players || 10

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center justify-between group"
                >
                  {/* Visual / Image area */}
                  <Link 
                    to={`/session/${s.id}`} 
                    className="w-full h-44 flex items-center justify-center overflow-hidden rounded-2xl mb-4 bg-white"
                  >
                    <img
                      src={illustration}
                      alt={s.title}
                      className="max-h-40 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Card Title & Subtitle */}
                  <div className="text-center mb-6 w-full">
                    <Link to={`/session/${s.id}`} className="hover:text-[#2F80ED] transition-colors">
                      <h3 className="text-xl font-bold text-gray-950 mb-1 px-1 line-clamp-2 min-h-[1.75rem]">
                        {s.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500 line-clamp-1 px-1">
                      {s.description || s.sport || 'Sportis Community'}
                    </p>
                  </div>

                  {/* Details (2x2 grid with Clock, MapPin, Users, Calendar) */}
                  <div className="w-full grid grid-cols-2 gap-3 text-xs text-gray-600 mb-6 px-2">
                    <div className="flex items-center gap-1.5" title="Uhrzeit">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{formattedTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5 justify-end" title="Ort">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{loc}</span>
                    </div>

                    <div className="flex items-center gap-1.5" title="Teilnehmer">
                      <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{participantCount}/{maxPlayers}</span>
                    </div>

                    <div className="flex items-center gap-1.5 justify-end" title="Datum">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  {/* Join Button (Black Pill or Green when joined) */}
                  <button
                    type="button"
                    onClick={() => handleJoin(s)}
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
        )}

      </div>
    </div>
  )
}
