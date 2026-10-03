import { useState, useEffect } from 'react'
import { MapPin, Calendar, Clock, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function IPhoneHome({ onNavigateCreate, onSelectSession }) {
  const { user } = useAuth()
  const [locationQuery, setLocationQuery] = useState('')
  const [umkreisQuery, setUmkreisQuery] = useState('')
  const [dateQuery, setDateQuery] = useState('')

  const [dbSessions, setDbSessions] = useState([])
  const [joinedSessions, setJoinedSessions] = useState(new Set(['figma-1']))

  // Countdown timer state for "Next Match"
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 30 })

  useEffect(() => {
    // Target date: 2 days, 14 hours, 30 mins from mount
    const target = new Date(Date.now() + (2 * 24 * 3600 + 14 * 3600 + 30 * 60) * 1000)

    const tick = () => {
      const diff = Math.max(0, target - new Date())
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const mins = Math.floor((diff / 1000 / 60) % 60)
      setTimeLeft({ days, hours, mins })
    }

    const interval = setInterval(tick, 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch real sessions from Supabase
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*, session_participants(user_id)')
          .order('created_at', { ascending: false })
          .limit(4)

        if (!error && data) {
          setDbSessions(data)
        }
      } catch (err) {
        console.warn('Fehler beim Laden von Supabase Sessions:', err)
      }
    }
    loadSessions()
  }, [])

  const handleToggleJoin = (sessionId, e) => {
    e.stopPropagation()
    const next = new Set(joinedSessions)
    if (next.has(sessionId)) {
      next.delete(sessionId)
      toast('Session verlassen')
    } else {
      next.add(sessionId)
      toast.success('Du bist der Session beigetreten! ⚽')
    }
    setJoinedSessions(next)
  }

  // Canonical cards from Figma screenshot
  const figmaCards = [
    {
      id: 'figma-basketball',
      sport: 'Basketball',
      title: 'Playing Basketball BWL',
      time: '17:00',
      location: 'Hamburg',
      date: '12.02.2026',
      illustration: '/iphone/sports_basketball.png',
    },
    {
      id: 'figma-football',
      sport: 'Football',
      title: 'Playing soccer This Weekend',
      time: '17:00',
      location: 'Hamburg',
      date: '12.02.2026',
      illustration: '/iphone/sports_soccer.png',
    },
  ]

  return (
    <div className="space-y-6 pb-20">
      
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 1. Filter Search Bar (Matching Figma Exact)                       */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-2">
        <div className="grid grid-cols-12 gap-1 items-center">
          
          <div className="col-span-4 flex items-center gap-1.5 px-2 py-1.5 border-r border-gray-100">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Location"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
            />
          </div>

          <div className="col-span-3 flex items-center px-2 py-1.5 border-r border-gray-100">
            <input
              type="text"
              placeholder="Umkreis"
              value={umkreisQuery}
              onChange={(e) => setUmkreisQuery(e.target.value)}
              className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
            />
          </div>

          <div className="col-span-3 flex items-center gap-1 px-2 py-1.5 border-r border-gray-100">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Date"
              value={dateQuery}
              onChange={(e) => setDateQuery(e.target.value)}
              className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
            />
          </div>

          <div className="col-span-2">
            <button
              type="button"
              className="w-full py-2 bg-[#2F80ED] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center"
            >
              Search
            </button>
          </div>

        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 2. Next Match Section Header + "Session Erstellen ->"             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-950 tracking-tight font-['Inter',sans-serif]">
          Next Match
        </h1>

        <button
          type="button"
          onClick={onNavigateCreate}
          className="inline-flex items-center gap-2 bg-black hover:bg-gray-900 text-white text-xs font-semibold pl-4 pr-1.5 py-1 rounded-full shadow-sm hover:scale-[1.02] transition-transform group"
        >
          <span>Session Erstellen</span>
          <div className="w-5 h-5 rounded-full bg-[#7DBBFF] text-black flex items-center justify-center">
            <ArrowRight className="w-3 h-3 text-black" />
          </div>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 3. Featured Next Match Card with Countdown                         */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-4 rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-[#17222F]">
        <img
          src="/iphone/next_match_card_exact.png"
          alt="Next Match"
          className="w-full aspect-[379/250] object-cover"
        />
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 4. Match Cards List (Figma Exact)                                  */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-4 space-y-4">
        {/* Basketball Card Exact */}
        <div className="relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.05)] border border-gray-100/90 group">
          <img
            src="/iphone/figma_bb_card.png"
            alt="Playing Basketball BWL"
            className="w-full aspect-[378/165] object-cover"
          />
          <button
            type="button"
            onClick={(e) => handleToggleJoin('figma-basketball', e)}
            className="absolute right-[3.5%] bottom-[4.5%] w-[27%] h-[24%] flex items-center justify-center"
          >
            {joinedSessions.has('figma-basketball') && (
              <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                Joined ✓
              </div>
            )}
          </button>
        </div>

        {/* Football Card Exact */}
        <div className="relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.05)] border border-gray-100/90 group">
          <img
            src="/iphone/figma_fb_card.png"
            alt="Playing soccer This Weekend"
            className="w-full aspect-[379/145] object-cover"
          />
          <button
            type="button"
            onClick={(e) => handleToggleJoin('figma-football', e)}
            className="absolute right-[3.5%] bottom-[5.5%] w-[28%] h-[27%] flex items-center justify-center"
          >
            {joinedSessions.has('figma-football') && (
              <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                Joined ✓
              </div>
            )}
          </button>
        </div>

        {/* Real Supabase Database sessions */}
        {dbSessions.map((s) => {
          const isJoined = joinedSessions.has(s.id)

          return (
            <div
              key={s.id}
              onClick={() => onSelectSession && onSelectSession(s.id)}
              className="bg-white rounded-3xl p-4 border border-blue-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-blue-50/50 rounded-2xl overflow-hidden">
                <img
                  src="/figma/sports_soccer.png"
                  alt={s.sport}
                  className="max-h-20 w-auto object-contain group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex-1 px-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <h4 className="text-base font-bold text-gray-950 leading-tight">
                    {s.sport || 'Session'}
                  </h4>
                </div>
                <p className="text-xs text-gray-600 font-medium mt-0.5 line-clamp-1">
                  {s.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{s.time || '18:00'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{s.location || 'Hamburg'}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleToggleJoin(s.id, e)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-xs ${
                    isJoined
                      ? 'bg-green-600 text-white'
                      : 'bg-[#0B0D17] hover:bg-black text-white'
                  }`}
                >
                  {isJoined ? 'Beigetreten' : 'Join'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
