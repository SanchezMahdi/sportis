import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Users, Calendar, Clock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { extractSessionImage } from '../lib/imageUtils'

// Pixel-accurate badge icons for mobile matching Figma node 172-1768
function CalendarBadgeIcon({ className = "w-4 h-4 text-gray-900" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="4" ry="4" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="9.5" x2="21" y2="9.5" strokeWidth="1.5" />
      <text x="12" y="17.5" fontSize="7" fontWeight="bold" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="sans-serif">17</text>
    </svg>
  )
}

function LocationBadgeIcon({ className = "w-4 h-4 text-gray-900" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5.5 5.5 0 0 0-5.5 5.5c0 4 5.5 9.5 5.5 9.5s5.5-5.5 5.5-9.5A5.5 5.5 0 0 0 12 2z" />
      <circle cx="12" cy="7.5" r="2" />
      <ellipse cx="12" cy="19.5" rx="7.5" ry="2.2" strokeWidth="1.5" />
    </svg>
  )
}

function ClockBadgeIcon({ className = "w-4 h-4 text-gray-900" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6.5 12 12 15 14" strokeWidth="2.2" />
    </svg>
  )
}

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
  return '12.10.2026'
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
  return '16:15'
}

const normalizeSport = (sport = '') => {
  const s = sport.toLowerCase()
  if (s.includes('fuss') || s.includes('foot') || s.includes('soccer')) return 'Soccer'
  if (s.includes('basket')) return 'Basketball'
  if (s.includes('skat')) return 'Skating'
  if (s.includes('bar') || s.includes('karaoke')) return 'Bar'
  return s.charAt(0).toUpperCase() + s.slice(1)
}



export default function Sessions() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [dbSessions, setDbSessions] = useState([])
  const [joinedIds, setJoinedIds] = useState(new Set())

  // Desktop search states
  const [locationInput, setLocationInput] = useState('')
  const [umkreisInput, setUmkreisInput] = useState('')
  const [dateInput, setDateInput] = useState('')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#2F80ED] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Fetch real sessions from Supabase
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

  // Map DB sessions
  const mappedDbSessions = dbSessions.map((s) => {
    const isJoined = s.session_participants?.some((p) => p.user_id === user?.id)
    const normalized = normalizeSport(s.sport)
    const isBar = normalized === 'Bar'
    const { imageUrl } = extractSessionImage(s.description)

    return {
      id: s.id,
      realSessionId: s.id,
      sport: s.sport,
      sportDisplay: normalized,
      title: s.title,
      timeDisplay: formatTime(s.time, s.scheduled_at),
      locationDisplay: s.location || s.location_name || s.address || 'Hamburg',
      spotsDisplay: `${s.session_participants?.length || 1}/${s.max_players || 10}`,
      dateDisplay: formatDate(s.date, s.scheduled_at),
      imageUrl: imageUrl || null,
      illustration: imageUrl || getSportIllustration(s.sport),
      isBar: isBar && !imageUrl,
      isJoined,
    }
  })

  // Desktop search filter
  const filteredDesktopSessions = mappedDbSessions.filter((c) => {
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

  const [profileName, setProfileName] = useState('')

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('users')
      .select('name, full_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name || data?.full_name) {
          setProfileName(data.name || data.full_name)
        }
      })
  }, [user?.id])

  // Mobile list: show only real sessions from database
  const mobileSessions = mappedDbSessions

  const rawName = profileName || user?.user_metadata?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : '')
  const userName = rawName
    ? (rawName.charAt(0).toUpperCase() + rawName.slice(1))
    : 'Sportler'
  const userAvatar = user?.user_metadata?.avatar_url

  return (
    <div>
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MOBILE VIEW (1:1 Figma node 172-1768 "iPhone 14 & 15 Pro Max - 2")  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden min-h-screen bg-white text-gray-900 font-['Inter',sans-serif] pb-20">
        <div className="max-w-md mx-auto px-4 pt-3">

          {/* 1. Greeting Banner ("Hallo, [Tatsächlicher Name]!" with authentic 3D graphics matching Figma 172-1768) */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-sm mb-3 select-none flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-[#291345] via-[#1a143b] to-[#101b38] border border-white/10 min-h-[66px]">
            {/* 3D Shapes Layer (Figma cylinder & sphere in background) */}
            <img 
              src="/iphone/banner_3d_shapes_final.png" 
              alt="" 
              className="absolute right-6 top-0 bottom-0 h-full w-auto object-cover pointer-events-none opacity-85 select-none" 
            />

            {/* Left: Avatar with green online dot + Greeting + Points */}
            <div className="relative z-10 flex items-center gap-3 min-w-0 pr-2">
              {/* Avatar */}
              <Link to="/profil" className="relative shrink-0 block" title="Mein Profil">
                <div className="w-11 h-11 rounded-2xl bg-white p-0.5 overflow-hidden shadow-xs flex items-center justify-center border border-white/90">
                  <img 
                    src={userAvatar || '/figma/avatar_profile_illustration.png'} 
                    alt={userName} 
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] rounded-full border-2 border-white shadow-xs"></span>
              </Link>

              {/* User Name & Points */}
              <div className="flex flex-col min-w-0">
                <Link to="/profil" className="text-white font-bold text-[15px] sm:text-base leading-tight truncate hover:underline block drop-shadow-xs">
                  Hallo, {userName}!
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-[#FACC15] font-semibold mt-0.5">
                  <svg className="w-3.5 h-3.5 fill-current shrink-0 text-[#FACC15]" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" fill="currentColor" />
                  </svg>
                  <span>+1600 Points</span>
                </div>
              </div>
            </div>

            {/* Right: Notification Bell with Red Dot */}
            <Link 
              to="/events" 
              className="relative z-10 p-2 text-white/90 hover:text-white shrink-0 active:scale-90 transition-transform"
              title="Benachrichtigungen"
            >
              <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-[#161f36]"></span>
            </Link>
          </div>

          {/* 2. Top Action Button: "Session Erstellen" (Black Pill on the right) */}
          <div className="flex justify-end mb-2">
            <Link
              to="/session/erstellen"
              className="bg-black hover:bg-neutral-800 text-white font-semibold text-xs px-6 py-2.5 rounded-full transition-all shadow-xs inline-flex items-center justify-center active:scale-95"
            >
              Session Erstellen
            </Link>
          </div>

          {/* 3. Heading: "Find" + "Your Session" (Figma node 172-1768) */}
          <div className="mb-4">
            <h2 className="text-[32px] font-extrabold text-black tracking-tight leading-[1.12]">
              Find
            </h2>
            <h2 className="text-[32px] font-extrabold text-[#761CBC] tracking-tight leading-[1.12]">
              Your Session
            </h2>
          </div>

          {/* 4. Heading: "Next Match" (Zilla Slab) */}
          <div className="mb-4">
            <h1 className="font-['Zilla_Slab',serif] text-[28px] font-black text-black tracking-tight select-none">
              Next Match
            </h1>
          </div>

          {/* 5. Mobile Match Cards (Horizontal Layout matching Figma 172-1768) */}
          {mobileSessions.length === 0 ? (
            <div className="bg-[#F6F9FE] rounded-[32px] border border-gray-100/90 shadow-[0_10px_35px_rgba(0,0,0,0.04)] p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center mb-4 border border-gray-100">
                <span className="text-3xl">🏃</span>
              </div>
              <h3 className="text-lg font-bold text-gray-950 mb-1">Keine Sessions vorhanden</h3>
              <p className="text-xs text-gray-500 mb-5 max-w-xs leading-relaxed">
                Aktuell sind keine Sessions eingetragen. Sei der Erste und erstelle jetzt eine Session!
              </p>
              <Link
                to="/session/erstellen"
                className="bg-black hover:bg-neutral-800 text-white font-semibold text-xs px-6 py-2.5 rounded-full transition-all shadow-xs inline-flex items-center gap-1.5 active:scale-95"
              >
                <span>Session erstellen</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#7DBBFF]" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {mobileSessions.map((session) => {
                const isJoined = session.isJoined || joinedIds.has(session.id)
                const detailUrl = `/session/${session.realSessionId || session.id}`

                return (
                  <div
                    key={session.id}
                    onClick={() => navigate(detailUrl)}
                    className="bg-[#F6F9FE] rounded-[32px] shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-gray-100/70 p-4 flex items-center justify-between gap-2 relative transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.09)] cursor-pointer group"
                  >
                    {/* Left: Sport Illustration */}
                    <div className="w-[125px] h-[130px] flex items-center justify-center shrink-0">
                      <img
                        src={session.illustration || getSportIllustration(session.sport)}
                        alt={session.title || session.sport || 'Session'}
                        className="w-full h-full object-contain mix-blend-multiply select-none group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Right: Info Badges & Join Action */}
                    <div className="flex-1 flex flex-col justify-between py-1 gap-4">
                      {/* Row 1: Date & Location */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Date Badge */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-[10px] bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center shrink-0">
                            <CalendarBadgeIcon className="w-4 h-4 text-gray-900" />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                            {session.dateDisplay}
                          </span>
                        </div>

                        {/* Location Badge */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-[10px] bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center shrink-0">
                            <LocationBadgeIcon className="w-4 h-4 text-gray-900" />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 truncate max-w-[85px]">
                            {session.locationDisplay}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Time & Join Button */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Time Badge */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-[10px] bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center shrink-0">
                            <ClockBadgeIcon className="w-4 h-4 text-gray-900" />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                            {session.timeDisplay}
                          </span>
                        </div>

                        {/* Join Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleJoin(session)
                          }}
                          className={`px-7 py-2 rounded-full font-semibold text-xs transition-all shadow-xs shrink-0 ${
                            isJoined
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-[#060016] hover:bg-black text-white active:scale-95'
                          }`}
                        >
                          {isJoined ? 'Beigetreten' : 'Join'}
                        </button>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP VIEW (Exclusively for Desktop/Tablet - Original Layout)     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block min-h-screen bg-[#FDFDFE] text-gray-900 font-['Inter',sans-serif] pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

          {/* 1. TOP FIGMA BANNER ("Find Your Community by joining Session") */}
          <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm mb-6 select-none">
            <img 
              src="/figma/sessions_community_banner.png" 
              alt="Find Your Community by joining Session" 
              className="w-full h-auto object-cover" 
            />
          </div>

          {/* 2. "SESSION ERSTELLEN" ACTION BUTTON (Black Pill with Blue Arrow) */}
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

          {/* 3. SEARCH & FILTER BAR */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-2 sm:p-2.5 mb-12">
            <div className="grid grid-cols-12 gap-2 items-center">
              
              {/* Location input */}
              <div className="col-span-4 flex items-center gap-3 px-4 py-2 border-r border-gray-100">
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
              <div className="col-span-3 flex items-center gap-3 px-4 py-2 border-r border-gray-100">
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
              <div className="col-span-3 flex items-center gap-3 px-4 py-2 border-r border-gray-100">
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
              <div className="col-span-2">
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

          {/* 4. SESSIONS CARDS (4-Column Grid for Desktop) */}
          {filteredDesktopSessions.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-gray-100/90 shadow-sm p-10 sm:p-14 text-center max-w-lg mx-auto flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-50 text-[#2F80ED] rounded-full flex items-center justify-center text-3xl mb-4 font-bold">
                ⚽
              </div>
              <h3 className="text-xl font-bold text-gray-950 mb-2">Keine Sessions gefunden</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                {locationInput || umkreisInput || dateInput
                  ? 'Für deine Suchkriterien wurden keine Sessions gefunden.'
                  : 'Es sind noch keine aktiven Sessions vorhanden. Erstelle jetzt die erste Session!'}
              </p>
              <Link
                to="/session/erstellen"
                className="inline-flex items-center gap-2 bg-[#0B0D17] hover:bg-black text-white text-sm font-semibold px-6 py-3 rounded-full transition-all shadow-xs"
              >
                <span>Session erstellen</span>
                <ArrowRight className="w-4 h-4 text-[#2F80ED]" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {filteredDesktopSessions.map((s) => {
                const isJoined = s.isJoined || joinedIds.has(s.id)
                const detailUrl = `/session/${s.realSessionId || s.id || 'football'}`

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
                      {s.imageUrl ? (
                        <div className="w-full h-full overflow-hidden rounded-2xl flex items-center justify-center bg-gray-50 border border-gray-100">
                          <img
                            src={s.imageUrl}
                            alt={s.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : s.isBar ? (
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
          )}

        </div>
      </div>
    </div>
  )
}
