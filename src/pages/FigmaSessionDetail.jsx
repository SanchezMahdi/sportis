import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Share2, 
  Send, 
  Sparkles, 
  Check, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Package,
  Award
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function FigmaSessionDetail() {
  const [joined, setJoined] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Anna',
      time: '15:42',
      text: "Hey, I'm coming! Looking forward to it! ⚽",
      avatar: '/figma/avatar4.png',
      isOwn: false,
    },
    {
      id: 2,
      sender: 'Lukas',
      time: '15:50',
      text: 'Great! Bring some water. See you soon!',
      avatar: '/figma/avatar2.png',
      isOwn: false,
    },
  ])
  const [inputMessage, setInputMessage] = useState('')

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'Du',
        time: timeStr,
        text: inputMessage.trim(),
        avatar: '/figma/avatar3.png',
        isOwn: true,
      },
    ])
    setInputMessage('')
    toast.success('Nachricht gesendet!')
  }

  const handleJoin = () => {
    setJoined((prev) => {
      const next = !prev
      if (next) {
        toast.success('Du bist der Session beigetreten! Viel Spaß beim Kicken!')
      } else {
        toast('Du hast die Session verlassen')
      }
      return next
    })
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link in Zwischenablage kopiert!')
    } else {
      toast.success('Session bereit zum Teilen!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F3FF]/60 via-[#F8FAFC] to-white text-gray-900 font-['Inter',sans-serif] pb-24">
      
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        
        {/* Two-Column Grid: Left (Hero Card + Chat) & Right (Sidebar Info) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ────────────────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN (lg:col-span-8)                                        */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Main Hero Card */}
            <div className="relative bg-white rounded-3xl overflow-hidden border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
              
              <div className="grid grid-cols-1 md:grid-cols-12">
                
                {/* Left Half: Details & CTAs */}
                <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="bg-purple-100/70 text-[#5B3FE9] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                        <span>⚽</span>
                        <span>Football</span>
                      </span>
                      <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-gray-500" />
                        <span>Beginner</span>
                      </span>
                      <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-gray-500" />
                        <span>Equipment provided</span>
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200/60">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Free</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight mb-4">
                      Football Session
                    </h1>

                    {/* Date, Time, Location */}
                    <div className="space-y-1.5 mb-6 text-xs sm:text-sm text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>Saturday, 3. October 2026</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>17:00 – 18:30</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>Hamburg Hafencity • Hafenkante Hamburg</span>
                      </div>
                    </div>

                    {/* Progress Bar: 4/12 Players */}
                    <div className="mb-6">
                      <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                        <span>{joined ? '5/12 players' : '4/12 players'}</span>
                        <span className="text-[#5B3FE9]">{joined ? '7 freie Plätze' : '8 freie Plätze'}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#5B3FE9] to-[#8B5CF6] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: joined ? '42%' : '33%' }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                      Let's play some football! All skill levels are welcome. Bring your energy and good vibes!
                    </p>
                  </div>

                  {/* CTA Buttons Row */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={handleJoin}
                      className={`inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all ${
                        joined
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-gradient-to-r from-[#5B3FE9] to-[#7C3AED] hover:from-[#4d33db] hover:to-[#6d28d9] text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      <span>{joined ? 'Angemeldet ✓' : 'Join Session'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl border border-gray-200 shadow-xs transition-all"
                    >
                      <Share2 className="w-4 h-4 text-gray-500" />
                      <span>Share</span>
                    </button>
                  </div>

                </div>

                {/* Right Half: Sunset Match & Good Vibes Only Photo */}
                <div className="md:col-span-5 relative min-h-[260px] md:min-h-full bg-gray-100">
                  <img 
                    src="/figma/v2/assets/detail_good_vibes_photo.png" 
                    alt="Football Game Sunset" 
                    className="w-full h-full object-cover" 
                  />
                </div>

              </div>

            </div>

            {/* 2. Session Chat Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-950 mb-6">
                Session Chat
              </h2>

              {/* Chat Messages */}
              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex items-start gap-3 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <img 
                      src={msg.avatar} 
                      alt={msg.sender} 
                      className="w-8 h-8 rounded-full object-cover border border-purple-100 shrink-0" 
                    />
                    <div className={`max-w-[80%] ${msg.isOwn ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-900">{msg.sender}</span>
                        <span className="text-[11px] text-gray-400">{msg.time}</span>
                      </div>
                      <div 
                        className={`text-xs sm:text-sm py-2 px-3.5 rounded-2xl inline-block leading-relaxed ${
                          msg.isOwn 
                            ? 'bg-[#5B3FE9] text-white rounded-tr-xs' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input 
                  type="text"
                  placeholder="Write a message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5B3FE9]/20 focus:border-[#5B3FE9] transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 w-9 h-9 rounded-full bg-[#5B3FE9] hover:bg-[#4d33db] text-white flex items-center justify-center transition-colors shadow-xs"
                  title="Nachricht senden"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>

            </div>

          </div>

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN: Sidebar (lg:col-span-4)                              */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card 1: Free Spots */}
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-[#5B3FE9]">
                  <Users className="w-5 h-5" />
                </div>
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>

              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Free Spots
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-gray-950">
                    {joined ? '7' : '8'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    von 12 gesamt
                  </span>
                </div>
              </div>

              <button
                onClick={handleJoin}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                  joined
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-[#5B3FE9] to-[#7C3AED] hover:from-[#4d33db] hover:to-[#6d28d9] text-white shadow-md'
                }`}
              >
                <span>{joined ? 'Bereits angemeldet ✓' : 'Join & Register'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Created by (Host) */}
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                Created by
              </p>
              
              <div className="flex items-center gap-4">
                <img 
                  src="/figma/v2/assets/host_tashi.png" 
                  alt="Host Tashi" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-purple-100 shrink-0" 
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-950 truncate">
                      Tashi
                    </h3>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>Hamburg</span>
                  </div>

                  {/* Reliability Score */}
                  <div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1">
                      <div className="bg-[#5B3FE9] h-1.5 rounded-full" style={{ width: '38%' }} />
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      38% reliability
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Participants */}
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Participants
                </p>
                <span className="text-xs font-bold text-[#5B3FE9]">
                  {joined ? '5/12' : '4/12'}
                </span>
              </div>

              {/* Avatars Stack */}
              <div className="flex items-center gap-2 mb-3">
                <img 
                  src="/figma/avatar1.png" 
                  alt="Player 1" 
                  className="w-9 h-9 rounded-full object-cover border-2 border-white ring-1 ring-purple-100" 
                />
                <img 
                  src="/figma/avatar2.png" 
                  alt="Player 2" 
                  className="w-9 h-9 rounded-full object-cover border-2 border-white ring-1 ring-purple-100" 
                />
                <div className="w-9 h-9 rounded-full bg-purple-100 text-[#5B3FE9] font-bold text-xs flex items-center justify-center border-2 border-white ring-1 ring-purple-100">
                  T
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border-2 border-white ring-1 ring-purple-100">
                  M
                </div>
                <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center border-2 border-white ring-1 ring-purple-100">
                  P
                </div>
                <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center border-2 border-white">
                  +2
                </div>
              </div>

              <p className="text-[11px] text-gray-400">
                Click on a participant to see their profile.
              </p>
            </div>

            {/* Card 4: Location & Map */}
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-[#5B3FE9]" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Location
                </p>
              </div>

              <h4 className="text-base font-bold text-gray-950 mb-0.5">
                Hafenkante Hamburg
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                Hamburg Hafencity
              </p>

              {/* Mini Map Thumbnail */}
              <div className="rounded-2xl overflow-hidden border border-gray-200/80 mb-4 h-36 bg-gray-100 relative group flex items-center justify-center">
                <img 
                  src="/figma/v2/assets/detail_mini_map_clean.png" 
                  alt="Map Hafenkante Hamburg" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              </div>

              <a
                href="https://maps.google.com/?q=Hafencity+Hamburg"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open in Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </a>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
