import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Zap } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { SPORT_EMOJIS, SKILL_COLORS } from '../lib/constants'

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function SessionCard({ session, currentUserId }) {
  const navigate = useNavigate()

  const participantCount = session.participant_count ?? session.session_participants?.length ?? 0
  const isFull = participantCount >= session.max_players
  const isParticipant = session.session_participants?.some(
    (p) => p.user_id === currentUserId
  )

  const emoji = SPORT_EMOJIS[session.sport] || '🏃'
  const skillColorClass = SKILL_COLORS[session.skill_level] || 'bg-gray-500'

  let formattedDate = ''
  try {
    formattedDate = format(parseISO(session.date), 'EEE, d. MMM yyyy', { locale: de })
  } catch {
    formattedDate = session.date
  }

  const formattedTime = session.time
    ? session.time.slice(0, 5)
    : ''

  const handleClick = () => {
    navigate(`/session/${session.id}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="bg-card rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 border border-white/5 flex flex-col gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Header: Sport badge + title */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-primary/20 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
              <span>{emoji}</span>
              <span>{session.sport}</span>
            </span>
            {session.equipment && (
              <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                Ausrüstung ✓
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold text-base leading-tight mt-1 group-hover:text-primary transition-colors truncate">
            {session.title}
          </h3>
        </div>

        {/* Skill level badge */}
        <span
          className={`${skillColorClass} text-white text-xs font-bold px-2 py-1 rounded-lg shrink-0`}
        >
          {session.skill_level}
        </span>
      </div>

      {/* Meta info */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted text-sm">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span>
            {formattedDate}
            {formattedTime && (
              <span className="ml-1 font-medium text-white">{formattedTime} Uhr</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted text-sm">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{session.location}</span>
        </div>

        <div className="flex items-center gap-2 text-muted text-sm">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span>
            <span className={isFull ? 'text-red-400' : 'text-white'}>
              {participantCount}
            </span>
            <span> / {session.max_players} Spieler:innen</span>
          </span>

          {/* Progress bar */}
          <div className="flex-1 bg-white/10 rounded-full h-1.5 ml-1">
            <div
              className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${Math.min((participantCount / session.max_players) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: gender filter + action button */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-muted text-xs">{session.gender_filter}</span>

        {isParticipant ? (
          <span className="inline-flex items-center gap-1 bg-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg">
            <Zap className="w-3 h-3" />
            Dabei!
          </span>
        ) : isFull ? (
          <span className="bg-white/10 text-muted text-xs font-semibold px-3 py-1.5 rounded-lg cursor-not-allowed">
            Voll
          </span>
        ) : (
          <span className="bg-primary text-dark text-xs font-bold px-3 py-1.5 rounded-lg group-hover:bg-green-400 transition-colors">
            Beitreten
          </span>
        )}
      </div>
    </div>
  )
}
