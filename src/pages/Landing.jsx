import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, X, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

// Die 6 exakten Roadmap-Schritte aus dem Figma-Board
const roadmapSteps = [
  {
    num: '#1',
    title: 'Meet new people',
    desc: 'Join Sportis, meet new people, and enjoy your first activities together. Whether you come alone or with friends, everyone is welcome.',
    row: 'top',
  },
  {
    num: '#2',
    title: 'Join different sessions',
    desc: 'Take part in different sessions, try new sports and formats, and discover what you enjoy most.',
    row: 'bottom',
  },
  {
    num: '#3',
    title: 'Build your team',
    desc: 'Meet people you connect with and form your own team. Find your teammates and start playing together regularly.',
    row: 'top',
  },
  {
    num: '#4',
    title: 'Play & connect',
    desc: 'Keep joining sessions, play together, improve as a team, and become part of the Sportis community.',
    row: 'bottom',
  },
  {
    num: '#5',
    title: 'Tournaments & events',
    desc: 'Put your team to the test in exciting tournaments and join special Sportis events with the community.',
    row: 'top',
  },
  {
    num: '#6',
    title: 'The Final Cup & Summer BBQ',
    desc: 'The season highlight: the big Sportis Final Cup followed by a summer BBQ, good food, music, and celebrating together with the whole community.',
    row: 'bottom',
  },
]

// Die 5 echten Sportis-Fotos aus dem Figma-Roadmap-Streifen (1:1 wie im Figma Board)
const roadmapPhotos = [
  {
    id: 1,
    src: '/gallery/photo_1_lawn.jpg',
    alt: 'Sportis Community auf dem Rasen',
  },
  {
    id: 2,
    src: '/gallery/photo_4_goal.jpg',
    alt: 'Sportis Spieler am Tor',
  },
  {
    id: 3,
    src: '/gallery/picture3_campus_match.jpg',
    alt: 'Sportis Campus Football Game',
  },
  {
    id: 4,
    src: '/figma/v2/assets/roadmap_picture4.jpg',
    alt: 'Moderner Kunstrasenplatz & Flutlicht',
  },
  {
    id: 5,
    src: '/gallery/picture5_tournament_sunset.jpg',
    alt: 'Sportis Final Football Tournament Sunset',
  },
]

// Echte Sportis-Fotos für die interaktive Bogengalerie (ohne Spikeball & Altona Story-Screenshot)
const galleryPhotos = [
  { id: 1, src: '/gallery/photo_6_pitch_banner.jpg', alt: 'Kunstrasenplatz mit Willkommen-Banner' },
  { id: 2, src: '/gallery/picture3_campus_match.jpg', alt: 'Sportis Campus Football Game' },
  { id: 3, src: '/gallery/photo_1_lawn.jpg', alt: 'Sportis Community auf dem Rasen' },
  { id: 4, src: '/gallery/photo_2_match_trees.jpg', alt: 'Fußballmatch vor Backsteingebäude' },
  { id: 5, src: '/gallery/photo_3_graffiti.jpg', alt: 'Match vor Graffiti-Container' },
  { id: 6, src: '/gallery/photo_4_goal.jpg', alt: 'Sportis Spieler am Tor' },
  { id: 7, src: '/gallery/photo_7_jerseys.png', alt: 'Sportis Trikots #6, #22, #9' },
  { id: 8, src: '/gallery/picture5_tournament_sunset.jpg', alt: 'Sportis Final Football Tournament Sunset' },
]

export default function Landing() {
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  // Mobile Auth & Login State (Figma Mobile Exact)
  const { user, profile, signIn } = useAuth()
  const navigate = useNavigate()
  const [mobileEmail, setMobileEmail] = useState('')
  const [mobilePassword, setMobilePassword] = useState('')
  const [showMobilePassword, setShowMobilePassword] = useState(false)
  const [mobileLoading, setMobileLoading] = useState(false)

  // When a user is logged in, redirect them to /sessions ONLY if they didn't navigate to a specific section (e.g. #about-us, #pictures)
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const id = hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      }
    } else if (user) {
      navigate('/sessions', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      if (hash) {
        const id = hash.replace('#', '')
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const handleMobileLogin = async (e) => {
    e.preventDefault()
    if (!mobileEmail) {
      toast.error('Bitte gib deine E-Mail-Adresse ein.')
      return
    }
    if (!mobilePassword) {
      toast.error('Bitte gib dein Passwort ein.')
      return
    }
    setMobileLoading(true)
    try {
      await signIn(mobileEmail, mobilePassword)
      toast.success('Willkommen zurück!')
      navigate('/sessions')
    } catch (err) {
      console.error(err)
      const msg = err?.message || ''
      if (msg.includes('Invalid login')) {
        toast.error('E-Mail oder Passwort ist falsch.')
      } else {
        toast.error('Anmeldung fehlgeschlagen: ' + msg)
      }
    } finally {
      setMobileLoading(false)
    }
  }

  const handleOAuth = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/sessions',
        },
      })
      if (error) throw error
    } catch (err) {
      toast.error(`${provider} Login derzeit nicht konfiguriert.`)
    }
  }

  const getPhoto = (offset) => {
    const idx = (galleryIndex + offset + galleryPhotos.length * 10) % galleryPhotos.length
    return galleryPhotos[idx]
  }

  const prevPhoto = () => {
    setGalleryIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
  }

  const nextPhoto = () => {
    setGalleryIndex((prev) => (prev + 1) % galleryPhotos.length)
  }

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden font-['Inter',sans-serif]">

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION (Exakt nach Figma Thumbnail.png)                       */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION                                                        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Desktop Hero (Exakt nach Figma Desktop Thumbnail.png) */}
      <section className="hidden lg:block relative pt-0 pb-4 md:pb-6 max-w-[1440px] mx-auto overflow-hidden">
        <h1 className="sr-only">Sportis – From Student for Student</h1>
        <div className="w-full flex justify-center items-center">
          <img 
            src="/figma/hero_banner_exact.png" 
            alt="From Student for Student - Sportis" 
            className="w-full h-auto object-contain select-none" 
          />
        </div>
      </section>

      {/* Mobile Hero (Exakt nach Figma iPhone 14 & 15 Pro Max - 1 Frame) */}
      <section className="lg:hidden relative pt-2 pb-8 px-5 max-w-md mx-auto overflow-hidden">
        <h1 className="sr-only">Sportis – From Student for Student</h1>

        {/* 1. Circular Sports Cluster Illustration */}
        <div className="w-full flex justify-center pt-2 pb-4">
          <img 
            src="/figma/login_sports_cluster_exact_hd.png" 
            alt="Sportis Sports Activities" 
            className="w-full max-w-[340px] h-auto object-contain select-none" 
          />
        </div>

        {/* 2. From Student for Student Typography */}
        <div className="mt-2 mb-8 text-left">
          <div className="font-['Zilla_Slab',serif] font-black leading-[1.08] tracking-tight">
            <div className="text-3xl min-[400px]:text-4xl text-black">
              From Student
            </div>
            <div className="text-xl min-[400px]:text-2xl text-black font-bold">
              for
            </div>
            <div className="text-4xl min-[400px]:text-5xl text-[#327BED] font-black -mt-0.5">
              Student
            </div>
          </div>
          
          <div className="mt-4 text-[11px] text-gray-500 font-medium">
            Crafted By
          </div>
          <div className="flex items-center gap-2 mt-1">
            <img 
              src="/figma/brand_sportis.png" 
              alt="Sportis" 
              className="h-6 w-auto object-contain" 
            />
          </div>
        </div>

        {/* 3. Welcome / Sign in Card */}
        <div className="w-full">
          <h2 className="font-['Zilla_Slab',serif] text-3xl font-black text-center text-gray-950 mb-6 tracking-tight">
            Welcome
          </h2>

          {user ? (
            <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-gray-200/90 text-center shadow-xs">
              <p className="text-xs text-gray-500 mb-1">Angemeldet als</p>
              <p className="font-bold text-gray-900 text-base mb-4 truncate">{profile?.name || user?.email}</p>
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/sessions"
                  className="w-full py-3 bg-[#1B2533] hover:bg-[#111827] text-white font-semibold rounded-xl text-sm transition-colors shadow-xs"
                >
                  Sessions entdecken
                </Link>
                <Link
                  to="/profil"
                  className="w-full py-2.5 bg-white border border-gray-200 text-gray-800 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Mein Profil
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleMobileLogin} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-900 mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  value={mobileEmail}
                  onChange={(e) => setMobileEmail(e.target.value)}
                  placeholder="Example@email.com"
                  className="w-full h-11 bg-white border border-gray-200/90 rounded-xl px-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#327BED] focus:ring-1 focus:ring-[#327BED] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-900 mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showMobilePassword ? 'text' : 'password'}
                    value={mobilePassword}
                    onChange={(e) => setMobilePassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full h-11 bg-white border border-gray-200/90 rounded-xl px-3.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#327BED] focus:ring-1 focus:ring-[#327BED] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMobilePassword(!showMobilePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showMobilePassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end -mt-1">
                <Link
                  to="/login"
                  className="text-xs text-[#327BED] font-medium hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={mobileLoading}
                className="w-full h-11 mt-1 bg-[#1B2533] hover:bg-[#111827] text-white font-semibold text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                {mobileLoading ? 'Signing in...' : 'Sign in'}
              </button>

              {/* Divider: Or */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-gray-200 w-full" />
                <span className="bg-white px-3 text-xs text-gray-400 absolute">Or</span>
              </div>

              {/* Social Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  className="w-full h-11 bg-[#F9FAFB] hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center gap-2.5 text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth('facebook')}
                  className="w-full h-11 bg-[#F9FAFB] hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center gap-2.5 text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
                >
                  <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Sign in with Facebook</span>
                </button>
              </div>

              <p className="text-center text-xs text-gray-600 mt-2">
                Don't you have an account?{' '}
                <Link to="/login" className="text-[#327BED] font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. CAMPUS LEAGUE / ROADMAP (5 echte Sportis-Fotos)                     */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section id="campus-league" className="pt-10 sm:pt-14 pb-24 bg-[#F6F9FE]">
        <div id="how-it-works" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Übertitel für Seite 2: Campus League */}
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-sm sm:text-base font-medium text-[#4A5568] tracking-wide">
              Campus League
            </h2>
          </div>

          {/* Desktop Process Timeline */}
          <div className="relative mb-16">
            
            {/* Desktop Timeline */}
            <div className="hidden lg:block relative">
              
              {/* TOP ROW (#1, #3, #5) */}
              <div className="grid grid-cols-3 gap-8 pb-8">
                {/* #1 Meet new people */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs hover:shadow-md transition-shadow">
                  <span className="text-[#BE185D] font-bold text-base mr-2">#1</span>
                  <span className="font-bold text-gray-900 text-base">Meet new people</span>
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    Join Sportis, meet new people, and enjoy your first activities together. Whether you come alone or with friends, everyone is welcome.
                  </p>
                </div>

                {/* #3 Build your team */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs hover:shadow-md transition-shadow">
                  <span className="text-[#BE185D] font-bold text-base mr-2">#3</span>
                  <span className="font-bold text-gray-900 text-base">Build your team</span>
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    Meet people you connect with and form your own team. Find your teammates and start playing together regularly.
                  </p>
                </div>

                {/* #5 Tournaments & events */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs hover:shadow-md transition-shadow">
                  <span className="text-[#BE185D] font-bold text-base mr-2">#5</span>
                  <span className="font-bold text-gray-900 text-base">Tournaments & events</span>
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    Put your team to the test in exciting tournaments and join special Sportis events with the community.
                  </p>
                </div>
              </div>

              {/* CONNECTING RED / PINK HORIZONTAL LINE WITH TROPHY */}
              <div className="relative my-4">
                <div className="h-[2px] w-full bg-[#FB7185]" />
                
                {/* Vertical markers on line */}
                <div className="absolute top-1/2 -translate-y-1/2 left-[16.6%] w-1.5 h-4 bg-[#FB7185]" />
                <div className="absolute top-1/2 -translate-y-1/2 left-[33.3%] w-1.5 h-4 bg-[#FB7185]" />
                <div className="absolute top-1/2 -translate-y-1/2 left-[50%] w-1.5 h-4 bg-[#FB7185]" />
                <div className="absolute top-1/2 -translate-y-1/2 left-[66.6%] w-1.5 h-4 bg-[#FB7185]" />
                <div className="absolute top-1/2 -translate-y-1/2 left-[83.3%] w-1.5 h-4 bg-[#FB7185]" />

                {/* Trophy at end of the line */}
                <div className="absolute right-0 -top-5">
                  <img 
                    src="/figma/trophy.png" 
                    alt="Sportis Trophy" 
                    className="w-10 h-10 object-contain drop-shadow-sm" 
                  />
                </div>
              </div>

              {/* 5 ECHTE SPORTIS FOTOS ZWISCHEN DEN ZEILEN */}
              <div className="py-6">
                <div className="grid grid-cols-5 gap-4 items-center">
                  {roadmapPhotos.map((photo) => (
                    <div 
                      key={photo.id}
                      className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs hover:shadow-md transition-all duration-300 group aspect-[4/3] bg-gray-50"
                    >
                      <img 
                        src={photo.src} 
                        alt={photo.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTTOM ROW (#2, #4, #6) */}
              <div className="grid grid-cols-3 gap-8 pt-4">
                {/* #2 Join different sessions */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs hover:shadow-md transition-shadow">
                  <span className="text-[#BE185D] font-bold text-base mr-2">#2</span>
                  <span className="font-bold text-gray-900 text-base">Join different sessions</span>
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    Take part in different sessions, try new sports and formats, and discover what you enjoy most.
                  </p>
                </div>

                {/* #4 Play & connect */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs hover:shadow-md transition-shadow">
                  <span className="text-[#BE185D] font-bold text-base mr-2">#4</span>
                  <span className="font-bold text-gray-900 text-base">Play & connect</span>
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    Keep joining sessions, play together, improve as a team, and become part of the Sportis community.
                  </p>
                </div>

                {/* #6 The Final Cup & Summer BBQ */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs hover:shadow-md transition-shadow">
                  <span className="text-[#BE185D] font-bold text-base mr-2">#6</span>
                  <span className="font-bold text-gray-900 text-base">The Final Cup & Summer BBQ</span>
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    The season highlight: the big Sportis Final Cup followed by a summer BBQ, good food, music, and celebrating together with the whole community.
                  </p>
                </div>
              </div>

            </div>

            {/* Mobile Alternating Timeline (Exakt nach Figma iPhone 14 & 15 Pro Max - 1 Frame) */}
            <div className="lg:hidden relative py-4 max-w-md mx-auto">
              
              {/* Central vertical pink stem running through Rows 1 to 5 */}
              <div className="absolute top-0 bottom-24 left-1/2 -translate-x-1/2 w-0.5 bg-[#BE185D]" />

              {/* Row 1: Left = Photo 1, Right = Card #1 */}
              <div className="relative grid grid-cols-2 gap-3 sm:gap-4 items-center mb-6">
                {/* Photo 1 */}
                <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-gray-200/90 shadow-2xs bg-white">
                  <img 
                    src={roadmapPhotos[0].src} 
                    alt={roadmapPhotos[0].alt} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                {/* Card #1 */}
                <div className="relative bg-white rounded-2xl p-3 sm:p-3.5 border border-pink-100/90 shadow-2xs">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-[#BE185D]" />
                  <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                    <span className="text-[#BE185D] mr-1 font-bold">#1</span>
                    <span>{roadmapSteps[0].title}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                    {roadmapSteps[0].desc}
                  </p>
                </div>
              </div>

              {/* Row 2: Left = Card #2, Right = Photo 2 */}
              <div className="relative grid grid-cols-2 gap-3 sm:gap-4 items-center mb-6">
                {/* Card #2 */}
                <div className="relative bg-white rounded-2xl p-3 sm:p-3.5 border border-pink-100/90 shadow-2xs">
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-[#BE185D]" />
                  <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                    <span className="text-[#BE185D] mr-1 font-bold">#2</span>
                    <span>{roadmapSteps[1].title}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                    {roadmapSteps[1].desc}
                  </p>
                </div>
                {/* Photo 2 */}
                <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-gray-200/90 shadow-2xs bg-white">
                  <img 
                    src={roadmapPhotos[1].src} 
                    alt={roadmapPhotos[1].alt} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>

              {/* Row 3: Left = Photo 3, Right = Card #3 */}
              <div className="relative grid grid-cols-2 gap-3 sm:gap-4 items-center mb-6">
                {/* Photo 3 */}
                <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-gray-200/90 shadow-2xs bg-white">
                  <img 
                    src={roadmapPhotos[2].src} 
                    alt={roadmapPhotos[2].alt} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                {/* Card #3 */}
                <div className="relative bg-white rounded-2xl p-3 sm:p-3.5 border border-pink-100/90 shadow-2xs">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-[#BE185D]" />
                  <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                    <span className="text-[#BE185D] mr-1 font-bold">#3</span>
                    <span>{roadmapSteps[2].title}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                    {roadmapSteps[2].desc}
                  </p>
                </div>
              </div>

              {/* Row 4: Left = Card #4, Right = Photo 4 */}
              <div className="relative grid grid-cols-2 gap-3 sm:gap-4 items-center mb-6">
                {/* Card #4 */}
                <div className="relative bg-white rounded-2xl p-3 sm:p-3.5 border border-pink-100/90 shadow-2xs">
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-[#BE185D]" />
                  <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                    <span className="text-[#BE185D] mr-1 font-bold">#4</span>
                    <span>{roadmapSteps[3].title}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                    {roadmapSteps[3].desc}
                  </p>
                </div>
                {/* Photo 4 */}
                <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-gray-200/90 shadow-2xs bg-white">
                  <img 
                    src={roadmapPhotos[3].src} 
                    alt={roadmapPhotos[3].alt} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>

              {/* Row 5: Left = Photo 5, Right = Card #5 */}
              <div className="relative grid grid-cols-2 gap-3 sm:gap-4 items-center mb-6">
                {/* Photo 5 */}
                <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-gray-200/90 shadow-2xs bg-white">
                  <img 
                    src={roadmapPhotos[4].src} 
                    alt={roadmapPhotos[4].alt} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                {/* Card #5 */}
                <div className="relative bg-white rounded-2xl p-3 sm:p-3.5 border border-pink-100/90 shadow-2xs">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-[#BE185D]" />
                  <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                    <span className="text-[#BE185D] mr-1 font-bold">#5</span>
                    <span>{roadmapSteps[4].title}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                    {roadmapSteps[4].desc}
                  </p>
                </div>
              </div>

              {/* Row 6: Centered Card #6 */}
              <div className="relative pt-2 text-left">
                <div className="max-w-[280px] sm:max-w-xs mx-auto bg-white rounded-2xl p-3.5 sm:p-4 border border-pink-100/90 shadow-2xs">
                  <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                    <span className="text-[#BE185D] mr-1.5 font-bold">#6</span>
                    <span>{roadmapSteps[5].title}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                    {roadmapSteps[5].desc}
                  </p>
                </div>

                {/* Vertical stem connecting to trophy */}
                <div className="w-0.5 h-7 bg-[#BE185D] mx-auto mt-0" />
                <img 
                  src="/figma/trophy.png" 
                  alt="Sportis Trophy" 
                  className="w-9 h-9 object-contain mx-auto -mt-0.5" 
                />
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. ABOUT US • SPORT BRINGS PEOPLE TOGETHER • MORE THAN JUST A GAME      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. ABOUT US • SPORT BRINGS PEOPLE TOGETHER • MORE THAN JUST A GAME      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section id="about-us" className="py-12 sm:py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Centered "About us" label on desktop */}
          <div className="text-center mb-8 sm:mb-14 hidden lg:block">
            <h2 className="text-sm sm:text-base font-medium text-[#4A5568] tracking-wide">
              About us
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Heading & Copy */}
            <div className="lg:col-span-6 flex flex-col items-start">
              {/* Pink accent line */}
              <div className="w-12 h-1 bg-[#BE185D] rounded-full mb-4 sm:mb-6" />
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl text-gray-900 font-normal leading-tight mb-4 sm:mb-6">
                Sport brings people together<br />
                <span className="font-bold text-gray-950">More than just a game</span>
              </h2>

              <p className="text-sm sm:text-[15px] leading-relaxed text-gray-600 mb-6 sm:mb-8 max-w-xl">
                Sportis makes it easy to meet new people, join different sports sessions, and become part of a community. Whether you come alone or with friends, every session is an opportunity to connect, have fun, and discover something new.
              </p>

              <Link
                to="/sessions"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#5B3FE9] hover:text-[#4534C7] group transition-colors mb-6 lg:mb-0"
              >
                <span>See more Informations</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right Column: Team Video Card with Play Button */}
            <div className="lg:col-span-6 flex justify-center">
              <div 
                onClick={() => setVideoModalOpen(true)}
                className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-gray-100 group cursor-pointer max-w-lg w-full aspect-[4/3] border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <img 
                  src="/figma/video_preview_two_students.png" 
                  alt="Sportis Video Preview" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 4. PICTURE • MEET THE COMMUNITY • MORE THAN JUST TEAMMATES             */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section id="pictures" className="pt-12 sm:pt-20 pb-16 sm:pb-20 bg-white border-t border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8 sm:mb-12">
            <div className="w-12 h-1 bg-[#BE185D] rounded-full mb-3 sm:mb-4" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl text-gray-900 font-normal">
              Meet the Community<br />
              <span className="font-bold text-gray-950">More than just teammates</span>
            </h2>
          </div>

          {/* Arched Photo Gallery Strip from Figma */}
          <div className="flex flex-col items-center">
            {/* Centered "Picture" label */}
            <div className="text-center mb-6 sm:mb-8 hidden lg:block">
              <h2 className="text-sm sm:text-base font-medium text-[#4A5568] tracking-wide">
                Picture
              </h2>
            </div>

            {/* Interactive Arched Photo Gallery */}
            <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-1 sm:gap-2.5 md:gap-3.5 select-none py-2 sm:py-4 px-1">
              
              {/* Slot -3 (Far Left Pill) */}
              <div 
                onClick={() => setGalleryIndex((prev) => (prev - 3 + galleryPhotos.length) % galleryPhotos.length)}
                className="w-2.5 min-[400px]:w-3.5 sm:w-6 md:w-8 h-24 min-[400px]:h-28 sm:h-36 md:h-44 rounded-full overflow-hidden shadow-2xs cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
                title={getPhoto(-3).alt}
              >
                <img 
                  src={getPhoto(-3).src} 
                  alt={getPhoto(-3).alt} 
                  className="w-full h-full object-cover transition-transform duration-500" 
                />
              </div>

              {/* Slot -2 (Mid Left Pill) */}
              <div 
                onClick={() => setGalleryIndex((prev) => (prev - 2 + galleryPhotos.length) % galleryPhotos.length)}
                className="w-5 min-[400px]:w-7 sm:w-12 md:w-16 lg:w-20 h-32 min-[400px]:h-40 sm:h-52 md:h-64 lg:h-72 rounded-full overflow-hidden shadow-xs cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
                title={getPhoto(-2).alt}
              >
                <img 
                  src={getPhoto(-2).src} 
                  alt={getPhoto(-2).alt} 
                  className="w-full h-full object-cover transition-transform duration-500" 
                />
              </div>

              {/* Slot -1 (Inner Left Pill) */}
              <div 
                onClick={prevPhoto}
                className="w-8 min-[400px]:w-11 sm:w-16 md:w-20 lg:w-24 h-40 min-[400px]:h-48 sm:h-64 md:h-72 lg:h-92 rounded-full overflow-hidden shadow-md cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
                title={getPhoto(-1).alt}
              >
                <img 
                  src={getPhoto(-1).src} 
                  alt={getPhoto(-1).alt} 
                  className="w-full h-full object-cover transition-transform duration-500" 
                />
              </div>

              {/* Slot 0 (Main Center Rounded Card) */}
              <div className="w-[190px] min-[400px]:w-[230px] sm:w-[380px] md:w-[480px] lg:w-[560px] h-48 min-[400px]:h-56 sm:h-[320px] md:h-[380px] lg:h-[410px] rounded-2xl sm:rounded-[36px] overflow-hidden shadow-xl border border-gray-100 transition-all duration-500 shrink-0 bg-gray-100 relative group">
                <img 
                  key={getPhoto(0).id}
                  src={getPhoto(0).src} 
                  alt={getPhoto(0).alt} 
                  className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500" 
                />
              </div>

              {/* Slot +1 (Inner Right Pill) */}
              <div 
                onClick={nextPhoto}
                className="w-8 min-[400px]:w-11 sm:w-16 md:w-20 lg:w-24 h-40 min-[400px]:h-48 sm:h-64 md:h-72 lg:h-92 rounded-full overflow-hidden shadow-md cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
                title={getPhoto(1).alt}
              >
                <img 
                  src={getPhoto(1).src} 
                  alt={getPhoto(1).alt} 
                  className="w-full h-full object-cover transition-transform duration-500" 
                />
              </div>

              {/* Slot +2 (Mid Right Pill) */}
              <div 
                onClick={() => setGalleryIndex((prev) => (prev + 2) % galleryPhotos.length)}
                className="w-5 min-[400px]:w-7 sm:w-12 md:w-16 lg:w-20 h-32 min-[400px]:h-40 sm:h-52 md:h-64 lg:h-72 rounded-full overflow-hidden shadow-xs cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
                title={getPhoto(2).alt}
              >
                <img 
                  src={getPhoto(2).src} 
                  alt={getPhoto(2).alt} 
                  className="w-full h-full object-cover transition-transform duration-500" 
                />
              </div>

              {/* Slot +3 (Far Right Pill) */}
              <div 
                onClick={() => setGalleryIndex((prev) => (prev + 3) % galleryPhotos.length)}
                className="w-2.5 min-[400px]:w-3.5 sm:w-6 md:w-8 h-24 min-[400px]:h-28 sm:h-36 md:h-44 rounded-full overflow-hidden shadow-2xs cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
                title={getPhoto(3).alt}
              >
                <img 
                  src={getPhoto(3).src} 
                  alt={getPhoto(3).alt} 
                  className="w-full h-full object-cover transition-transform duration-500" 
                />
              </div>

            </div>

            {/* Navigation Carousel Buttons (< >) */}
            <div className="flex items-center gap-4 mt-6 sm:mt-8">
              <button 
                type="button"
                onClick={prevPhoto}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#6B7280] hover:bg-[#4B5563] active:bg-[#374151] text-white flex items-center justify-center transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={nextPhoto}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#6B7280] hover:bg-[#4B5563] active:bg-[#374151] text-white flex items-center justify-center transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* VIDEO PREVIEW MODAL                                                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-dark rounded-3xl overflow-hidden max-w-3xl w-full border border-white/10 shadow-2xl">
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full">
              <video 
                src="/video/sportisvideo.mp4" 
                controls 
                autoPlay 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
