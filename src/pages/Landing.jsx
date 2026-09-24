import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react'

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

// Die 5 echten Sportis-Fotos aus dem Roadmap-Streifen
const roadmapPhotos = [
  {
    id: 1,
    src: '/figma/v2/assets/roadmap_picture1.jpg',
    alt: 'Sportis Football 1v1 Match',
  },
  {
    id: 2,
    src: '/figma/v2/assets/roadmap_picture2.jpg',
    alt: 'Sportis Volleyball Spike Match',
  },
  {
    id: 3,
    src: '/figma/v2/assets/roadmap_picture3.jpg',
    alt: 'Sportis Campus Football Game',
  },
  {
    id: 4,
    src: '/figma/v2/assets/roadmap_picture4.jpg',
    alt: 'Moderner Kunstrasenplatz & Flutlicht',
  },
  {
    id: 5,
    src: '/figma/v2/assets/roadmap_picture5.jpg',
    alt: 'Sportis Final Football Tournament Sunset',
  },
]

// Die 10 echten Sportis-Fotos aus dem Bilder-Ordner für die interaktive Bogengalerie
const galleryPhotos = [
  { id: 1, src: '/gallery/photo_1_lawn.jpg', alt: 'Sportis Community auf dem Rasen' },
  { id: 2, src: '/gallery/photo_2_match_trees.jpg', alt: 'Fußballmatch vor Backsteingebäude' },
  { id: 3, src: '/gallery/photo_4_goal.jpg', alt: 'Sportis Spieler am Tor' },
  { id: 4, src: '/gallery/photo_7_jerseys.png', alt: 'Sportis Trikots #6, #22, #9' },
  { id: 5, src: '/gallery/photo_8_tabletennis.jpg', alt: 'Tischtennis Match am Libeskind-Bau' },
  { id: 6, src: '/gallery/photo_9_spikeball.jpg', alt: 'Spikeball auf dem Rasen' },
  { id: 7, src: '/gallery/photo_10_cali.jpg', alt: 'Cali Park Altona Meetup' },
  { id: 8, src: '/gallery/photo_6_pitch_banner.jpg', alt: 'Kunstrasenplatz mit Willkommen-Banner' },
  { id: 9, src: '/gallery/photo_5_team_grass.jpg', alt: 'Sportis Team auf dem Platz' },
  { id: 10, src: '/gallery/photo_3_graffiti.jpg', alt: 'Match vor Graffiti-Container' },
]

export default function Landing() {
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

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
      <section className="relative pt-0 pb-4 md:pb-6 max-w-[1440px] mx-auto overflow-hidden">
        <h1 className="sr-only">Sportis – From Student for Student</h1>
        <div className="w-full flex justify-center items-center">
          <img 
            src="/figma/hero_banner_exact.png" 
            alt="From Student for Student - Sportis" 
            className="w-full h-auto object-contain select-none" 
          />
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

            {/* Mobile / Tablet Responsive Stack */}
            <div className="lg:hidden space-y-4">
              {roadmapSteps.map((step) => (
                <div key={step.num} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#BE185D] font-bold text-lg">{step.num}</span>
                    <span className="font-bold text-gray-900 text-base">{step.title}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}

              {/* Photos Carousel on Mobile */}
              <div className="pt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {roadmapPhotos.map((p) => (
                  <div key={p.id} className="w-44 h-32 shrink-0 rounded-xl overflow-hidden border border-gray-200">
                    <img src={p.src} alt={p.alt} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. ABOUT US • SPORT BRINGS PEOPLE TOGETHER • MORE THAN JUST A GAME      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section id="about-us" className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Centered "About us" label */}
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-sm sm:text-base font-medium text-[#4A5568] tracking-wide">
              About us
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Heading & Copy */}
            <div className="lg:col-span-6 flex flex-col items-start">
              {/* Pink accent line */}
              <div className="w-12 h-1 bg-[#BE185D] rounded-full mb-6" />
              
              <h2 className="text-3xl sm:text-4xl text-gray-900 font-normal leading-tight mb-6">
                Sport brings people together<br />
                <span className="font-bold text-gray-950">More than just a game</span>
              </h2>

              <p className="text-[15px] leading-relaxed text-gray-600 mb-8 max-w-xl">
                Sportis makes it easy to meet new people, join different sports sessions, and become part of a community. Whether you come alone or with friends, every session is an opportunity to connect, have fun, and discover something new.
              </p>

              <Link
                to="/sessions"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#5B3FE9] hover:text-[#4534C7] group transition-colors"
              >
                <span>See more Informations</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right Column: Team Video Card with Play Button */}
            <div className="lg:col-span-6 flex justify-center">
              <div 
                onClick={() => setVideoModalOpen(true)}
                className="relative rounded-3xl overflow-hidden shadow-xl bg-gray-100 group cursor-pointer max-w-lg w-full aspect-[4/3] border border-gray-100 hover:shadow-2xl transition-all duration-300"
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
      <section id="pictures" className="pt-20 pb-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-12">
            <div className="w-12 h-1 bg-[#BE185D] rounded-full mb-4" />
            <h2 className="text-3xl sm:text-4xl text-gray-900 font-normal">
              Meet the Community<br />
              <span className="font-bold text-gray-950">More than just teammates</span>
            </h2>
          </div>

          {/* Arched Photo Gallery Strip from Figma */}
          <div className="flex flex-col items-center">
            {/* Centered "Picture" label */}
            <div className="text-center mb-8">
              <h2 className="text-sm sm:text-base font-medium text-[#4A5568] tracking-wide">
                Picture
              </h2>
            </div>

            {/* Interactive Arched Photo Gallery */}
            <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-2 sm:gap-3.5 select-none py-4 px-2 min-h-[420px]">
              
              {/* Slot -3 (Far Left Pill) */}
              <div 
                onClick={() => setGalleryIndex((prev) => (prev - 3 + galleryPhotos.length) % galleryPhotos.length)}
                className="hidden xl:block w-7 lg:w-8 h-40 sm:h-44 rounded-full overflow-hidden shadow-xs cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
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
                className="hidden md:block w-14 sm:w-18 lg:w-20 h-64 sm:h-72 rounded-full overflow-hidden shadow-sm cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
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
                className="w-14 sm:w-20 lg:w-24 h-72 sm:h-92 rounded-full overflow-hidden shadow-md cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
                title={getPhoto(-1).alt}
              >
                <img 
                  src={getPhoto(-1).src} 
                  alt={getPhoto(-1).alt} 
                  className="w-full h-full object-cover transition-transform duration-500" 
                />
              </div>

              {/* Slot 0 (Main Center Rounded Card) */}
              <div className="w-[280px] sm:w-[440px] md:w-[500px] lg:w-[560px] h-64 sm:h-[380px] md:h-[410px] rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-xl border border-gray-100 transition-all duration-500 shrink-0 bg-gray-100 relative group">
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
                className="w-14 sm:w-20 lg:w-24 h-72 sm:h-92 rounded-full overflow-hidden shadow-md cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
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
                className="hidden md:block w-14 sm:w-18 lg:w-20 h-64 sm:h-72 rounded-full overflow-hidden shadow-sm cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
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
                className="hidden xl:block w-7 lg:w-8 h-40 sm:h-44 rounded-full overflow-hidden shadow-xs cursor-pointer hover:opacity-85 hover:scale-105 transition-all duration-300 shrink-0 bg-gray-100"
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
            <div className="flex items-center gap-4 mt-8">
              <button 
                type="button"
                onClick={prevPhoto}
                className="w-11 h-11 rounded-full bg-[#6B7280] hover:bg-[#4B5563] active:bg-[#374151] text-white flex items-center justify-center transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={nextPhoto}
                className="w-11 h-11 rounded-full bg-[#6B7280] hover:bg-[#4B5563] active:bg-[#374151] text-white flex items-center justify-center transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
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
