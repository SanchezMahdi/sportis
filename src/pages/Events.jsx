import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, Clock, MapPin, Users, ArrowRight, Check, X, Sparkles, PartyPopper, Briefcase, Compass } from 'lucide-react'
import toast from 'react-hot-toast'

const initialEvents = [
  {
    id: 1,
    category: 'Party',
    categoryIcon: '🎉',
    categoryBadge: 'Party',
    image: '/figma/v2/assets/ev1.png',
    day: '04',
    month: 'Okt',
    title: 'Erstsemester Party',
    location: 'Mensa Campus',
    city: 'Hamburg',
    attendees: '850+',
    time: 'Ab 22:00 Uhr',
    description: 'Die offizielle Welcome-Party für alle Erstis & Higher Semester! Drei Dancefloors, faire Studierendenpreise und beste Beats die ganze Nacht.',
    organizer: 'Fachschaftsrat',
    freeEntry: true,
  },
  {
    id: 2,
    category: 'Career',
    categoryIcon: '💼',
    categoryBadge: 'Career & Education',
    image: '/figma/v2/assets/ev2.png',
    day: '08',
    month: 'Okt',
    title: 'Jobmesse Hamburg',
    location: 'CCH Hamburg',
    city: 'Hamburg',
    attendees: '1.2k',
    time: '10:00 – 17:00 Uhr',
    description: 'Triff über 60 Top-Arbeitgeber, Start-ups und Tech-Unternehmen. Kostenlose Bewerbungsmappen-Checks, Speed-Interviews und professionelle Bewerbungsfotos direkt vor Ort.',
    organizer: 'Career Center',
    freeEntry: true,
  },
  {
    id: 3,
    category: 'Party',
    categoryIcon: '🎉',
    categoryBadge: 'Party',
    image: '/figma/v2/assets/ev3.png',
    day: '18',
    month: 'Okt',
    title: 'AStA Party',
    location: 'Stadtpark Hamburg',
    city: 'Hamburg',
    attendees: '1.5k',
    time: 'Ab 21:00 Uhr',
    description: 'Das legendäre Open-Air & Club-Event des AStA. Mit Live-DJs, Streetfood-Trucks und Outdoor-Chillout-Area.',
    organizer: 'AStA Uni Hamburg',
    freeEntry: true,
  },
  {
    id: 4,
    category: 'Career',
    categoryIcon: '💼',
    categoryBadge: 'Career & Education',
    image: '/figma/v2/assets/ev4.png',
    day: '22',
    month: 'Okt',
    title: 'Workshop: Bewerbung & Karriere',
    location: 'Uni Hamburg, Hörsaal B',
    city: 'Hamburg',
    attendees: '200',
    time: '14:00 – 16:00 Uhr',
    description: 'Interaktiver Workshop für LinkedIn-Optimierung, Tech-Interviews und Gehaltsverhandlung für Werkstudierende und Berufseinsteiger:innen.',
    organizer: 'Alumni Network',
    freeEntry: true,
  },
  {
    id: 5,
    category: 'Other',
    categoryIcon: '🎪',
    categoryBadge: 'Other',
    image: '/figma/v2/assets/ev5.png',
    day: '31',
    month: 'Okt',
    title: 'Campus Festival',
    location: 'Uni Campus',
    city: 'Hamburg',
    attendees: '2.3k',
    time: '15:00 – 01:00 Uhr',
    description: 'Großes Kultur- & Musikfestival auf dem Hauptcampus mit 2 Live-Bühnen, Sport-Turnieren (Spikeball & Basketball), Poetry Slam und Food Market.',
    organizer: 'Campus Kultur e.V.',
    freeEntry: true,
  },
  {
    id: 6,
    category: 'Other',
    categoryIcon: '🎪',
    categoryBadge: 'Other',
    image: '/figma/v2/assets/ev6.png',
    day: '12',
    month: 'Nov',
    title: 'Winter Market',
    location: 'Uni Campus Innenhof',
    city: 'Hamburg',
    attendees: '1.1k',
    time: '16:00 – 22:00 Uhr',
    description: 'Glühwein, vegane Leckereien, Lichterketten und akustische Live-Musik. Der gemütlichste Treffpunkt nach den Nachmittagsvorlesungen.',
    organizer: 'Studentenwerk',
    freeEntry: true,
  },
]

export default function Events() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeModalEvent, setActiveModalEvent] = useState(null)
  const [rsvpEvents, setRsvpEvents] = useState({})

  const filteredEvents = useMemo(() => {
    return initialEvents.filter((ev) => {
      const matchFilter = 
        selectedFilter === 'all' ||
        (selectedFilter === 'Party' && ev.category === 'Party') ||
        (selectedFilter === 'Career' && ev.category === 'Career') ||
        (selectedFilter === 'Other' && ev.category === 'Other')

      const matchSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchFilter && matchSearch
    })
  }, [selectedFilter, searchQuery])

  const toggleRsvp = (eventId) => {
    setRsvpEvents((prev) => {
      const nextState = !prev[eventId]
      if (nextState) {
        toast.success('Du bist angemeldet! Wir freuen uns auf dich.')
      } else {
        toast('Teilnahme zurückgezogen')
      }
      return { ...prev, [eventId]: nextState }
    })
  }

  return (
    <div className="bg-white min-h-screen text-gray-900 font-['Inter',sans-serif] pb-24">
      
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO BANNER: Meet. Party. Experience.                               */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="pt-6 sm:pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-lg border border-purple-100">
          <img 
            src="/figma/v2/assets/events_banner_perfect.png" 
            alt="Campus Events: Meet. Party. Experience. - More than just sports" 
            className="w-full h-auto object-cover select-none" 
          />
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. FILTER & SEARCH BAR                                                 */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-gray-100">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedFilter === 'all'
                  ? 'bg-[#5B3FE9] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setSelectedFilter('Party')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedFilter === 'Party'
                  ? 'bg-[#5B3FE9] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Parties
            </button>
            <button
              onClick={() => setSelectedFilter('Career')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedFilter === 'Career'
                  ? 'bg-[#5B3FE9] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Career & Education
            </button>
            <button
              onClick={() => setSelectedFilter('Other')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedFilter === 'Other'
                  ? 'bg-[#5B3FE9] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Festival & Other
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5B3FE9]/20 focus:border-[#5B3FE9] transition-all"
            />
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. UPCOMING EVENTS GRID (2 Rows x 3 Cols = 6 Cards)                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight">
            Upcoming Events
          </h2>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-500 text-sm">Keine Events gefunden für deine Suche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((ev) => {
              const isJoined = !!rsvpEvents[ev.id]
              return (
                <div
                  key={ev.id}
                  className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                  onClick={() => setActiveModalEvent(ev)}
                >
                  {/* Thumbnail with native Figma badge */}
                  <div className="relative aspect-[416/146] w-full overflow-hidden bg-gray-100">
                    <img 
                      src={ev.image} 
                      alt={ev.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-1 justify-between">
                    
                    <div className="flex gap-4 items-start">
                      {/* Date Block */}
                      <div className="shrink-0 w-12 h-14 bg-purple-50 rounded-2xl flex flex-col items-center justify-center border border-purple-100/80">
                        <span className="text-lg font-black text-[#5B3FE9] leading-none">
                          {ev.day}
                        </span>
                        <span className="text-[10px] font-bold text-[#5B3FE9]/80 uppercase mt-0.5">
                          {ev.month}
                        </span>
                      </div>

                      {/* Event Title & Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-950 group-hover:text-[#5B3FE9] transition-colors leading-snug line-clamp-1 mb-1">
                          {ev.title}
                        </h3>

                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Attendees, Time & Arrow Button */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>{ev.attendees}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{ev.time}</span>
                        </span>
                      </div>

                      {/* Purple circular arrow button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveModalEvent(ev)
                        }}
                        className="w-9 h-9 rounded-full bg-[#5B3FE9] hover:bg-[#4d33db] text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs shrink-0"
                        title="Event ansehen"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        )}

      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 4. EVENT DETAILS MODAL                                                 */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Image */}
            <div className="relative h-52 w-full bg-gray-100">
              <img 
                src={activeModalEvent.image} 
                alt={activeModalEvent.title} 
                className="w-full h-full object-cover" 
              />
              <button
                onClick={() => setActiveModalEvent(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-4 bg-white/95 backdrop-blur-xs text-gray-900 font-bold text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                <span>{activeModalEvent.categoryIcon}</span>
                <span>{activeModalEvent.categoryBadge}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2 text-xs font-semibold text-[#5B3FE9]">
                <span>{activeModalEvent.day}. {activeModalEvent.month} 2026</span>
                <span>•</span>
                <span>{activeModalEvent.time}</span>
              </div>

              <h3 className="text-2xl font-black text-gray-950 mb-2">
                {activeModalEvent.title}
              </h3>

              <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{activeModalEvent.location}, {activeModalEvent.city}</span>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                {activeModalEvent.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-800">{activeModalEvent.attendees}</span> Studierende interessiert
                </div>

                <button
                  onClick={() => toggleRsvp(activeModalEvent.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    rsvpEvents[activeModalEvent.id]
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-[#5B3FE9] text-white hover:bg-[#4d33db]'
                  }`}
                >
                  {rsvpEvents[activeModalEvent.id] ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Dabei!</span>
                    </>
                  ) : (
                    <span>Ich bin dabei</span>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}
