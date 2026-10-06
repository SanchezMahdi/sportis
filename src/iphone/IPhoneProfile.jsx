import { useState } from 'react'
import { User, Settings, Bell, LogOut, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function IPhoneProfile({ onNavigateLogin, onNavigateSetup }) {
  const { user, signOut } = useAuth()
  const [profileExpanded, setProfileExpanded] = useState(true)
  const [settingsExpanded, setSettingsExpanded] = useState(true)
  const [notificationsAllowed, setNotificationsAllowed] = useState(true)
  const [language, setLanguage] = useState('Eng')

  const userName = user?.user_metadata?.name || 'Mahdi Sanchez'
  const userEmail = user?.email || 'mahdi.sanchez@sportis.app'
  const userUni = user?.user_metadata?.university || 'Universität Hamburg (UHH)'
  const userLocation = user?.user_metadata?.city || 'Hamburg'

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Abgemeldet')
      if (onNavigateLogin) onNavigateLogin()
    } catch {
      toast.error('Fehler beim Abmelden')
    }
  }

  const toggleNotifications = () => {
    setNotificationsAllowed(!notificationsAllowed)
    toast(notificationsAllowed ? 'Benachrichtigungen deaktiviert' : 'Benachrichtigungen aktiviert')
  }

  return (
    <div className="space-y-6 pb-24 text-gray-900 font-['Inter',sans-serif]">
      
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Floating White Profile Card (Matching Figma Exact)                 */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-6 bg-white rounded-[32px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100">
        
        {/* Top Header: Avatar + Your Name + yourname@gmail.com */}
        <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-100 shadow-sm shrink-0">
            <img
              src="/iphone/avatar_photo.png"
              alt={userName}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = '/iphone/avatar_setup.png' }}
            />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-950 leading-tight">
              {userName}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {userEmail}
            </p>
          </div>
        </div>

        {/* Accordion 1: My Profile */}
        <div className="pt-4 border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={() => setProfileExpanded(!profileExpanded)}
            className="w-full flex items-center justify-between text-left py-2 group"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-800 stroke-[2]" />
              <span className="text-sm font-bold text-gray-950">
                My Profile
              </span>
            </div>
            {profileExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
            )}
          </button>

          {profileExpanded && (
            <div className="mt-3 pl-8 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium text-gray-400">Name</span>
                <span className="font-semibold text-gray-900">{userName}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium text-gray-400">Email account</span>
                <span className="font-semibold text-gray-900">{userEmail}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium text-gray-400">University</span>
                <span className="font-semibold text-gray-900">{userUni}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium text-gray-400">Location</span>
                <span className="font-semibold text-gray-900">{userLocation}</span>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={onNavigateSetup}
                  className="text-xs font-bold text-[#5B3FE9] hover:underline"
                >
                  Profil bearbeiten
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: Settings */}
        <div className="pt-3 border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className="w-full flex items-center justify-between text-left py-2 group"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-800 stroke-[2]" />
              <span className="text-sm font-bold text-gray-950">
                Settings
              </span>
            </div>
            {settingsExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
            )}
          </button>

          {settingsExpanded && (
            <div className="mt-3 pl-8 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-600">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-900 font-semibold focus:outline-none"
              >
                <option value="Eng">Eng</option>
                <option value="De">De</option>
              </select>
            </div>
          )}
        </div>

        {/* Item 3: Notification [Allow] */}
        <div className="py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-800 stroke-[2]" />
            <span className="text-sm font-bold text-gray-950">
              Notification
            </span>
          </div>

          <button
            type="button"
            onClick={toggleNotifications}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              notificationsAllowed
                ? 'bg-blue-50 text-[#2F80ED] border border-blue-200'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {notificationsAllowed ? 'Allow ✓' : 'Muted'}
          </button>
        </div>

        {/* Item 4: Log Out */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 py-2 text-left text-gray-800 hover:text-red-600 transition-colors group"
          >
            <LogOut className="w-5 h-5 text-gray-800 group-hover:text-red-600 transition-colors" />
            <span className="text-sm font-bold">
              Log Out
            </span>
          </button>
        </div>

      </div>

    </div>
  )
}
