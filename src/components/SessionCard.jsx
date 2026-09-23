import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Zap, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { SPORT_EMOJIS, SKILL_COLORS, toSportLabel, toSkillLabel } from '../lib/constants'
import {
  SoccerFieldPlaceholder,
  BasketballCourtPlaceholder,
  TennisCourtPlaceholder,
  VolleyballCourtPlaceholder,
  PingPongPlaceholder,
} from './SportPlaceholder'

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Sport Placeholder Components
const SPORT_PLACEHOLDERS = {
  Fußball: SoccerFieldPlaceholder,
  Basketball: BasketballCourtPlaceholder,
  Tennis: TennisCourtPlaceholder,
  Volleyball: VolleyballCourtPlaceholder,
  Tischtennis: PingPongPlaceholder,
}

// Hochwertige Sport-Bilder - LOKALE PFADE
const SPORT_IMAGES = {
  Fußball: '/sports/hallen_futsal.png',
  Basketball: '/sports/baskettball.png',
  Tennis: '/sports/tennis.png',
  Volleyball: '/sports/vollyball.png',
  Tischtennis: '/sports/tischtenis.png',
}

export default function SessionCard({ session, currentUserId }) {
  const navigate = useNavigate()

  const participantCount = session.participant_count ?? session.session_participants?.length ?? 0
  const isFull = participantCount >= session.max_players
  const isParticipant = session.session_participants?.some(
    (p) => p.user_id === currentUserId
  )

  const sportLabel = toSportLabel(session.sport)
  const skillLabel = toSkillLabel(session.skill_level)
  const emoji = SPORT_EMOJIS[sportLabel] || '🏃'
  const skillColorClass = SKILL_COLORS[skillLabel] || 'bg-gray-500'
  const PlaceholderComponent = SPORT_PLACEHOLDERS[sportLabel]
  const sportImage = SPORT_IMAGES[sportLabel]

  let formattedDate = ''
  try {
    formattedDate = format(parseISO(session.date), 'd. MMM', { locale: de })
  } catch {
    formattedDate = session.date
  }

  let formattedFullDate = ''
  try {
    formattedFullDate = format(parseISO(session.date), 'EEEE, d. MMMM yyyy', { locale: de })
  } catch {
    formattedFullDate = session.date
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
      className="group cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="bg-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 h-full flex flex-col">
        
        {/* Platz-Bild Bereich */}
        <div 
          className="relative h-40 overflow-hidden bg-dark bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
          style={sportImage ? { backgroundImage: `url('${sportImage}')` } : {}}
        >
          {!sportImage && PlaceholderComponent && (
            <div className="absolute inset-0">
              <PlaceholderComponent />
            </div>
          )}
          
          {/* Overlay für besseren Text-Kontrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Top-Right: Skill Level Badge */}
          <div className="absolute top-4 right-4 z-10">
            <span
              className={`${skillColorClass} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}
            >
              {skillLabel}
            </span>
          </div>

          {/* Sport Name unten links */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm text-dark px-3 py-2 rounded-lg shadow-lg font-semibold">
              <span className="text-lg">{emoji}</span>
              <span>{sportLabel}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col gap-3">
          
          {/* Titel */}
          <h3 className="text-white font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {session.title}
          </h3>

          {/* Zeit und Ort */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-sm text-muted group-hover:text-white/70 transition-colors">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium">{formattedDate}</span>
              {formattedTime && (
                <>
                  <span className="text-white/30">•</span>
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium">{formattedTime}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted group-hover:text-white/70 transition-colors">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate font-medium">{session.location}</span>
            </div>
          </div>

          {/* Spieler Anzahl */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg flex-1">
              <Users className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-white">
                <span className="text-primary">{participantCount}</span>
                <span className="text-white/60">/{session.max_players}</span>
              </span>
              {isFull && (
                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded ml-auto font-semibold">
                  Voll
                </span>
              )}
            </div>
          </div>

          {/* Equipment Badge */}
          {session.equipment && (
            <div className="inline-flex items-center gap-2 bg-blue-500/15 text-blue-300 text-xs font-semibold px-3 py-2 rounded-lg border border-blue-500/30 w-fit">
              <Zap className="w-3.5 h-3.5" />
              Ausrüstung vorhanden
            </div>
          )}
        </div>

        {/* Button Area */}
        <div className="px-5 pb-4 pt-2 border-t border-white/5">
          <button
            className="w-full bg-gradient-to-r from-primary to-green-400 text-dark font-bold py-2.5 rounded-lg hover:from-primary hover:to-primary shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-95"
          >
            Zum Event →
          </button>
        </div>
      </div>
    </div>
  )
}
