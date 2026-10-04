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
      <div className="relative w-full aspect-[460/90] rounded-2xl overflow-hidden shadow-sm">
        <img
          src="/iphone/header_banner_clean.png"
          alt={`Hallo, ${userName}!`}
          className="w-full h-full object-cover"
        />

        {/* Custom Avatar Overlay if user uploaded a custom profile picture */}
        {userAvatar && (
          <div className="absolute left-[3.2%] top-[8.5%] w-[15.8%] aspect-square rounded-[14px] overflow-hidden bg-white p-0.5">
            <img src={userAvatar} alt={userName} className="w-full h-full object-cover rounded-[12px]" />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-[#22C55E] rounded-full border-2 border-white"></span>
          </div>
        )}

        {/* Dynamic User Name */}
        <div className="absolute left-[24.5%] top-[14%] right-[16%] flex items-center">
          <span 
            className="text-white font-bold text-[14px] sm:text-[16px] tracking-tight truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
            title={`Hallo, ${userName}!`}
          >
            Hallo, {userName}!
          </span>
        </div>

        {/* Profile Tap Zone */}
        <button
          type="button"
          onClick={onNavigateProfile}
          className="absolute left-0 top-0 bottom-0 w-3/4 opacity-0 cursor-pointer"
          title="Profil ansehen"
        />
        {/* Notification Bell Tap Zone */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="absolute right-0 top-0 bottom-0 w-1/4 opacity-0 cursor-pointer"
          title="Benachrichtigungen"
        />
      </div>
    </div>
  )
}

