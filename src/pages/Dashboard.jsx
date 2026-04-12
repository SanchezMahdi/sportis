import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Calendar, Clock, MapPin, Users, ChevronRight, Inbox } from 'lucide-react'
import { format, parseISO, isFuture, isPast } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORT_EMOJIS } from '../lib/constants'
import LoadingSpinner from '../components/LoadingSpinner'

function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
        active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-white'
      }`}
    >
      {children}
      {count > 0 && (
        <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
          active ? 'bg-primary text-dark' : 'bg-white/10 text-muted'
        }`}>{count}</span>
      )}
    </button>
  )
}

function SessionRow({ session, showWaitlist }) {
  const dateStr = session.date
    ? format(parseISO(session.date), 'EEE, d. MMM yyyy', { locale: de })
    : ''
  const timeStr = session.time?.slice(0, 5) || ''
  const emoji = SPORT_EMOJIS[session.sport] || '🏃'
  const count = session.session_participants?.filter(p => !p.waitlist).length ?? 0
  const isOnWaitlist = showWaitlist && session.session_participants?.some(p => p.waitlist)

  return (
    <Link
      to={`/session/${session.id}`}
      className="flex items-center gap-4 p-4 bg-dark rounded-xl border border-white/5 hover:border-white/20 transition-all group"
    >
      <div className="text-2xl shrink-0">{emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-semibold text-sm truncate">{session.title}</p>
          {isOnWaitlist && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full shrink-0">
              Warteliste
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-muted text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3" />{dateStr}
          </span>
          {timeStr && (
            <span className="text-muted text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeStr} Uhr
            </span>
          )}
          <span className="text-muted text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" />{session.location}
          </span>
          <span className="text-muted text-xs flex items-center gap-1">
            <Users className="w-3 h-3" />{count}/{session.max_players}
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted group-hover:text-white transition-colors shrink-0" />
    </Link>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="w-12 h-12 text-muted/20 mb-3" />
      <p className="text-muted text-sm">{message}</p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('upcoming')
  const [createdSessions, setCreatedSessions] = useState([])
  const [joinedSessions, setJoinedSessions] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    const load = async () => {
      setLoading(true)
      const [created, joined, requests] = await Promise.all([
        supabase
          .from('sessions')
          .select('*, session_participants(user_id, waitlist)')
          .eq('creator_id', user.id)
          .order('date', { ascending: true }),
        supabase
          .from('session_participants')
          .select('session:sessions(*, session_participants(user_id, waitlist)), waitlist')
          .eq('user_id', user.id),
        supabase
          .from('join_requests')
          .select('*, session:sessions(id, title, sport, date, time, location)')
          .eq('user_id', user.id)
          .eq('status', 'pending'),
      ])
      setCreatedSessions(created.data || [])
      setJoinedSessions((joined.data || []).map(r => ({ ...r.session, _waitlist: r.waitlist })))
      setPendingRequests(requests.data || [])
      setLoading(false)
    }
    load()
  }, [user, navigate])

  if (!user) return null
  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>

  const today = new Date().toISOString().split('T')[0]

  const upcomingCreated = createdSessions.filter(s => s.date >= today)
  const pastCreated = createdSessions.filter(s => s.date < today)

  const upcomingJoined = joinedSessions.filter(s => s?.date >= today)
  const pastJoined = joinedSessions.filter(s => s?.date < today)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Meine Sessions</h1>
          <p className="text-muted mt-1">Übersicht über deine Aktivitäten</p>
        </div>
        <Link
          to="/session/erstellen"
          className="flex items-center gap-2 bg-primary text-dark font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-green-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Erstellen
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Erstellt', value: createdSessions.length },
          { label: 'Beigetreten', value: joinedSessions.length },
          { label: 'Ausstehend', value: pendingRequests.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card rounded-2xl border border-white/10 p-4 text-center">
            <p className="text-3xl font-black text-white">{value}</p>
            <p className="text-muted text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-6 flex gap-1 overflow-x-auto">
        <TabButton active={tab === 'upcoming'} onClick={() => setTab('upcoming')} count={upcomingCreated.length + upcomingJoined.length}>
          Kommend
        </TabButton>
        <TabButton active={tab === 'created'} onClick={() => setTab('created')} count={createdSessions.length}>
          Erstellt
        </TabButton>
        <TabButton active={tab === 'joined'} onClick={() => setTab('joined')} count={joinedSessions.length}>
          Beigetreten
        </TabButton>
        <TabButton active={tab === 'requests'} onClick={() => setTab('requests')} count={pendingRequests.length}>
          Anfragen
        </TabButton>
        <TabButton active={tab === 'past'} onClick={() => setTab('past')} count={pastCreated.length + pastJoined.length}>
          Vergangen
        </TabButton>
      </div>

      {/* Content */}
      {tab === 'upcoming' && (
        <div className="flex flex-col gap-3">
          {upcomingCreated.length === 0 && upcomingJoined.length === 0 ? (
            <EmptyState message="Keine kommenden Sessions. Erstelle eine oder tritt einer bei!" />
          ) : (
            <>
              {upcomingCreated.length > 0 && (
                <>
                  <p className="text-muted text-xs uppercase tracking-wide font-semibold">Von dir erstellt</p>
                  {upcomingCreated.map(s => <SessionRow key={s.id} session={s} />)}
                </>
              )}
              {upcomingJoined.length > 0 && (
                <>
                  <p className="text-muted text-xs uppercase tracking-wide font-semibold mt-2">Beigetreten</p>
                  {upcomingJoined.map(s => <SessionRow key={s.id} session={s} showWaitlist />)}
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'created' && (
        <div className="flex flex-col gap-3">
          {createdSessions.length === 0
            ? <EmptyState message="Du hast noch keine Sessions erstellt." />
            : createdSessions.map(s => <SessionRow key={s.id} session={s} />)
          }
        </div>
      )}

      {tab === 'joined' && (
        <div className="flex flex-col gap-3">
          {joinedSessions.length === 0
            ? <EmptyState message="Du bist noch keiner Session beigetreten." />
            : joinedSessions.map(s => s && <SessionRow key={s.id} session={s} showWaitlist />)
          }
        </div>
      )}

      {tab === 'requests' && (
        <div className="flex flex-col gap-3">
          {pendingRequests.length === 0 ? (
            <EmptyState message="Keine offenen Anfragen." />
          ) : (
            pendingRequests.map(req => (
              <Link
                key={req.id}
                to={`/session/${req.session?.id}`}
                className="flex items-center gap-4 p-4 bg-dark rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all group"
              >
                <div className="text-2xl">{SPORT_EMOJIS[req.session?.sport] || '🏃'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{req.session?.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-muted text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{req.session?.location}
                    </span>
                  </div>
                </div>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full shrink-0">Ausstehend</span>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'past' && (
        <div className="flex flex-col gap-3">
          {pastCreated.length === 0 && pastJoined.length === 0 ? (
            <EmptyState message="Keine vergangenen Sessions." />
          ) : (
            <>
              {pastCreated.length > 0 && (
                <>
                  <p className="text-muted text-xs uppercase tracking-wide font-semibold">Erstellt</p>
                  {pastCreated.map(s => <SessionRow key={s.id} session={s} />)}
                </>
              )}
              {pastJoined.length > 0 && (
                <>
                  <p className="text-muted text-xs uppercase tracking-wide font-semibold mt-2">Beigetreten</p>
                  {pastJoined.map(s => s && <SessionRow key={s.id} session={s} />)}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
