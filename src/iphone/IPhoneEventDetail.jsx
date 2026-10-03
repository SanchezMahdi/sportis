import { useState } from 'react'
import { ArrowLeft, Bookmark, Calendar, MapPin, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function IPhoneEventDetail({ onBack }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [invited, setInvited] = useState(false)

  const handleBookmark = () => {
    setBookmarked(!bookmarked)
    toast(bookmarked ? 'Lesezeichen entfernt' : 'Event gespeichert! 🔖')
  }

  const handleInvite = () => {
    setInvited(true)
    toast.success('Einladungslink in die Zwischenablage kopiert!')
  }

  const handleBuyTicket = () => {
    toast.success('Ticket erfolgreich gebucht! 🎉 Wir freuen uns auf dich!')
  }

  return (
    <div className="relative min-h-screen bg-white pb-24 text-gray-900 font-['Inter',sans-serif]">
      
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 1. Hero Image with Back Button & Bookmark                          */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="relative h-64 w-full overflow-hidden bg-gray-950">
        <img
          src="/iphone/event_details_hero.png"
          alt="Event Crowd"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/30" />

        {/* Top Bar with Back Arrow and Bookmark */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 text-white">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Zurück"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <h2 className="text-lg font-bold text-white drop-shadow-sm">
            Event Details
          </h2>

          <button
            type="button"
            onClick={handleBookmark}
            className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Event merken"
          >
            <Bookmark
              className={`w-5 h-5 transition-transform active:scale-125 ${
                bookmarked ? 'fill-white text-white' : 'text-white'
              }`}
            />
          </button>
        </div>

        {/* Floating Attendees Card docked at bottom of hero */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[88%] bg-white rounded-full p-2 pl-4 shadow-lg border border-gray-100 flex items-center justify-between z-20">
          <div className="flex items-center -space-x-2">
            <img
              src="/iphone/avatar_setup.png"
              alt="Attendee 1"
              className="w-9 h-9 rounded-full ring-2 ring-white object-cover bg-blue-100"
            />
            <img
              src="/figma/avatar1.png"
              alt="Attendee 2"
              className="w-9 h-9 rounded-full ring-2 ring-white object-cover bg-amber-100"
              onError={(e) => { e.target.src = '/iphone/avatar_setup.png' }}
            />
            <img
              src="/figma/avatar2.png"
              alt="Attendee 3"
              className="w-9 h-9 rounded-full ring-2 ring-white object-cover bg-emerald-100"
              onError={(e) => { e.target.src = '/iphone/avatar_setup.png' }}
            />
          </div>

          <button
            type="button"
            onClick={handleInvite}
            className="bg-[#4E62F8] hover:bg-[#3E52E8] text-white text-xs font-semibold px-5 py-2 rounded-full transition-colors shadow-xs"
          >
            {invited ? 'Eingeladen ✓' : 'Invite'}
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 2. Main Content Details                                            */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mt-10 px-6 space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight leading-tight">
            Ersti Party Uni Hamburg
          </h1>
        </div>

        {/* Date & Time Row */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#4E62F8] shrink-0">
            <Calendar className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-950">
              15. November 2026
            </h4>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Samstag, 19:00 - 03:00 Uhr
            </p>
          </div>
        </div>

        {/* Location Row */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#4E62F8] shrink-0">
            <MapPin className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-950">
              Reeperbahn Club Hamburg
            </h4>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Große Freiheit 36, 20359 Hamburg
            </p>
          </div>
        </div>

        {/* Organizer Row */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-orange-100">
            <img
              src="/iphone/avatar_setup.png"
              alt="Organizer"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-950">
              Mahdi Sanchez
            </h4>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Veranstalter & Sportis Captain
            </p>
          </div>
        </div>

        {/* About Event Description */}
        <div className="space-y-2 pt-2">
          <h3 className="text-base font-bold text-gray-950">
            Über das Event
          </h3>
          <p className="text-xs leading-relaxed text-gray-600 font-normal">
            Das größte Sportler- und Erstsemester-Event Hamburgs! Genieße Live-DJs, nimm an kleinen Challenges teil und lerne neue Mitspieler für deine nächsten Sessions kennen. Ein Welcome-Drink ist im Ticket enthalten.{' '}
            <span className="text-[#4E62F8] font-semibold cursor-pointer">
              Mehr anzeigen
            </span>
          </p>
        </div>

      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 3. Sticky Bottom CTA: "TICKET SICHERN • 7,00 € ->"                */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40 max-w-md mx-auto">
        <button
          type="button"
          onClick={handleBuyTicket}
          className="w-full h-14 bg-[#4E62F8] hover:bg-[#3E52E8] active:scale-[0.99] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#4E62F8]/25 transition-all flex items-center justify-center gap-3"
        >
          <span>TICKET SICHERN • 7,00 €</span>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </button>
      </div>

    </div>
  )
}
