import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { extractSessionImage } from '../lib/imageUtils'

// Pixel-accurate badge icons matching Homepage.png
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

// Canonical Figma Showcase Session (matching Homepage.png exactly)
const CANONICAL_SHOWCASE_SESSION = {
  id: 'showcase-soccer-homepage',
  sport: 'Soccer',
  sportDisplay: 'Soccer',
  title: 'Playing soccer This Weekend',
  timeDisplay: '16:15',
  locationDisplay: 'Hamburg',
  dateDisplay: '12.10.2026',
  illustration: '/figma/sports_soccer.png',
  isJoined: false,
}

export default function Sessions() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [dbSessions, setDbSessions] = useState([])
  const [joinedIds, setJoinedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
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

  // Map DB sessions to clean card format
  const mappedDbSessions = dbSessions.map((s) => {
    const isJoined = s.session_participants?.some((p) => p.user_id === user?.id)
    const { imageUrl } = extractSessionImage(s.description)

    return {
      id: s.id,
      realSessionId: s.id,
      sport: s.sport,
      title: s.title,
      timeDisplay: formatTime(s.time, s.scheduled_at),
      locationDisplay: s.location || s.location_name || s.address || 'Hamburg',
      dateDisplay: formatDate(s.date, s.scheduled_at),
      illustration: imageUrl || getSportIllustration(s.sport),
      isJoined,
    }
  })

  // If there are real sessions in the database, display them.
  // Otherwise, display the canonical showcase session from Homepage.png
  const sessionsToDisplay = mappedDbSessions.length > 0 
    ? mappedDbSessions 
    : [CANONICAL_SHOWCASE_SESSION]

  return (
    <div className="min-h-screen bg-white text-gray-900 font-['Inter',sans-serif] pb-20 sm:pb-28">
      <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6">

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 1. TOP ACTION BUTTON ("Session Erstellen")                          */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="flex justify-end pt-5 sm:pt-7 mb-4 sm:mb-6">
          <Link
            to="/session/erstellen"
            className="bg-black hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm px-6 sm:px-7 py-2.5 sm:py-3 rounded-full transition-all shadow-xs inline-flex items-center justify-center active:scale-95"
          >
            Session Erstellen
          </Link>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 2. SECTION HEADING ("Next Match")                                  */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="mb-5 sm:mb-7">
          <h1 className="font-['Zilla_Slab',serif] text-[32px] sm:text-4xl lg:text-5xl font-black text-black tracking-tight select-none">
            Next Match
          </h1>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 3. MATCH CARDS (Homepage.png layout)                               */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 sm:gap-6">
          {sessionsToDisplay.map((session) => {
            const isJoined = session.isJoined || joinedIds.has(session.id)
            const detailUrl = session.realSessionId ? `/session/${session.realSessionId}` : '/session/erstellen'

            return (
              <div
                key={session.id}
                onClick={() => navigate(detailUrl)}
                className="bg-[#F6F9FE] rounded-[32px] sm:rounded-[36px] shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-gray-100/70 p-4 sm:p-5 flex items-center justify-between gap-2 sm:gap-4 relative transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.09)] cursor-pointer group"
              >
                {/* Left: Sport Illustration */}
                <div className="w-[125px] sm:w-[145px] h-[130px] sm:h-[145px] flex items-center justify-center shrink-0">
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
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    {/* Date Badge */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-8 h-8 rounded-[10px] bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center shrink-0">
                        <CalendarBadgeIcon className="w-4 h-4 text-gray-900" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {session.dateDisplay}
                      </span>
                    </div>

                    {/* Location Badge */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-8 h-8 rounded-[10px] bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center shrink-0">
                        <LocationBadgeIcon className="w-4 h-4 text-gray-900" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[85px] sm:max-w-[120px]">
                        {session.locationDisplay}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Time & Join Button */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Time Badge */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-8 h-8 rounded-[10px] bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center shrink-0">
                        <ClockBadgeIcon className="w-4 h-4 text-gray-900" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {session.timeDisplay}
                      </span>
                    </div>

                    {/* Join Button (matches Homepage.png pill) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleJoin(session)
                      }}
                      className={`px-7 sm:px-8 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all shadow-xs shrink-0 ${
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

      </div>
    </div>
  )
}
