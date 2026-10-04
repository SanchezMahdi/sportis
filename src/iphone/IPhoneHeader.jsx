import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function IPhoneHeader({ onNavigateProfile, onOpenNotifications }) {
  const { user } = useAuth()
  const [profileName, setProfileName] = useState('')

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('users')
      .select('name, full_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name || data?.full_name) {
          setProfileName(data.name || data.full_name)
        }
      })
  }, [user?.id])

  const rawName = profileName || user?.user_metadata?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : '')
  const userName = rawName
    ? (rawName.charAt(0).toUpperCase() + rawName.slice(1))
    : 'Sportler'
  const userAvatar = user?.user_metadata?.avatar_url

  return (
    <div className="relative mx-4 mt-2 mb-3 select-none">
      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-[#291345] via-[#1a143b] to-[#101b38] border border-white/10 min-h-[66px]">
        {/* 3D Shapes Layer (Figma cylinder & sphere in background) */}
        <img 
          src="/iphone/banner_3d_shapes_final.png" 
          alt="" 
          className="absolute right-6 top-0 bottom-0 h-full w-auto object-cover pointer-events-none opacity-85 select-none" 
        />

        {/* Left: Avatar with green online dot + Greeting + Points */}
        <div className="relative z-10 flex items-center gap-3 min-w-0 pr-2">
          {/* Avatar */}
          <button 
            type="button" 
            onClick={onNavigateProfile} 
            className="relative shrink-0 block cursor-pointer" 
            title="Mein Profil"
          >
            <div className="w-11 h-11 rounded-2xl bg-white p-0.5 overflow-hidden shadow-xs flex items-center justify-center border border-white/90">
              <img 
                src={userAvatar || '/figma/avatar_profile_illustration.png'} 
                alt={userName} 
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] rounded-full border-2 border-white shadow-xs"></span>
          </button>

          {/* User Name & Points */}
          <div className="flex flex-col min-w-0">
            <button 
              type="button" 
              onClick={onNavigateProfile}
              className="text-white font-bold text-[15px] sm:text-base leading-tight truncate hover:underline block drop-shadow-xs text-left cursor-pointer"
            >
              Hallo, {userName}!
            </button>
            <div className="flex items-center gap-1.5 text-xs text-[#FACC15] font-semibold mt-0.5">
              <svg className="w-3.5 h-3.5 fill-current shrink-0 text-[#FACC15]" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" fill="currentColor" />
              </svg>
              <span>+1600 Points</span>
            </div>
          </div>
        </div>

        {/* Right: Notification Bell with Red Dot */}
        <button 
          type="button"
          onClick={onOpenNotifications}
          className="relative z-10 p-2 text-white/90 hover:text-white shrink-0 active:scale-90 transition-transform cursor-pointer"
          title="Benachrichtigungen"
        >
          <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-[#161f36]"></span>
        </button>
      </div>
    </div>
  )
}

