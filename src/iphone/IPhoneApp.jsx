import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Smartphone, Monitor, ChevronRight } from 'lucide-react'
import IPhoneStatusBar from './IPhoneStatusBar'
import IPhoneHeader from './IPhoneHeader'
import IPhoneTabBar from './IPhoneTabBar'
import IPhoneHome from './IPhoneHome'
import IPhoneSpots from './IPhoneSpots'
import IPhoneEvents from './IPhoneEvents'
import IPhoneEventDetail from './IPhoneEventDetail'
import IPhoneCreateSession from './IPhoneCreateSession'
import IPhoneProfile from './IPhoneProfile'
import IPhoneLogin from './IPhoneLogin'
import IPhoneProfileSetup from './IPhoneProfileSetup'
import { useAuth } from '../context/AuthContext'

export default function IPhoneApp({ initialTab = 'home', initialView = null }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Navigation state
  const [activeTab, setActiveTab] = useState(initialTab)
  const [currentView, setCurrentView] = useState(initialView) // 'create_session' | 'event_detail' | 'login' | 'profile_setup' | null
  const [selectedEventId, setSelectedEventId] = useState(null)

  // Simulator controls
  const [showDeviceFrame, setShowDeviceFrame] = useState(true)

  // Scroll to top on view/tab switch
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeTab, currentView])

  const handleTabChange = (tabId) => {
    setCurrentView(null)
    setActiveTab(tabId)
  }

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId)
    setCurrentView('event_detail')
  }

  const handleCreatedSession = () => {
    setCurrentView(null)
    setActiveTab('home')
  }

  const isSubPage = currentView !== null

  return (
    <div className="min-h-screen bg-[#0E1017] flex flex-col items-center justify-start sm:py-6 sm:px-4 font-['Inter',sans-serif] selection:bg-[#5B3FE9]/20">
      
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Top Desktop Controls Bar (Visible on Desktop only)                 */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[440px] mb-3 px-3 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-white tracking-wide">iPhone App (Figma Sportis-2)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDeviceFrame(!showDeviceFrame)}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center gap-1.5"
            title="Rahmen umschalten"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{showDeviceFrame ? 'Ohne Rahmen' : 'Mit Rahmen'}</span>
          </button>

          <Link
            to="/"
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center gap-1.5"
            title="Zur Web-Version"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Web</span>
          </Link>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* iPhone Device Frame Container                                      */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div
        className={`w-full max-w-[420px] bg-[#FDFDFE] relative flex flex-col transition-all duration-300 ${
          showDeviceFrame
            ? 'sm:rounded-[52px] sm:shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_0_12px_#1E222D,0_0_0_14px_#2D3242] sm:border-[2px] sm:border-gray-800 sm:overflow-hidden min-h-[880px]'
            : 'min-h-screen'
        }`}
      >
        
        {/* 1. iOS Status Bar */}
        <IPhoneStatusBar dark={currentView === 'event_detail'} />

        {/* 2. Top Universal Header (Only shown on primary tabs: Home, Suche, Events) */}
        {!isSubPage && activeTab !== 'profile' && (
          <IPhoneHeader
            onNavigateProfile={() => handleTabChange('profile')}
            onOpenNotifications={() => {}}
          />
        )}

        {/* 3. Screen Views Switcher */}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          {currentView === 'login' && (
            <IPhoneLogin
              onSuccess={() => setCurrentView(null)}
              onNavigateSetup={() => setCurrentView('profile_setup')}
            />
          )}

          {currentView === 'profile_setup' && (
            <IPhoneProfileSetup
              onComplete={() => {
                setCurrentView(null)
                setActiveTab('profile')
              }}
            />
          )}

          {/* 3. Main Views & Tabs */}
          {!user && currentView !== 'profile_setup' ? (
            <IPhoneLogin
              onSuccess={() => setCurrentView(null)}
              onNavigateSetup={() => setCurrentView('profile_setup')}
            />
          ) : (
            <>
              {currentView === 'create_session' && (
                <IPhoneCreateSession
                  onCreated={handleCreatedSession}
                  onBack={() => setCurrentView(null)}
                />
              )}

              {currentView === 'event_detail' && (
                <IPhoneEventDetail
                  onBack={() => setCurrentView(null)}
                />
              )}

              {!currentView && activeTab === 'home' && (
                <IPhoneHome
                  onNavigateCreate={() => setCurrentView('create_session')}
                  onSelectSession={(id) => navigate(`/session/${id}`)}
                />
              )}

              {!currentView && activeTab === 'suche' && (
                <IPhoneSpots
                  onSelectSpot={(spot) => {}}
                />
              )}

              {!currentView && activeTab === 'events' && (
                <IPhoneEvents
                  onSelectEvent={handleSelectEvent}
                />
              )}

              {!currentView && activeTab === 'profile' && (
                <IPhoneProfile
                  onNavigateLogin={() => setCurrentView('login')}
                  onNavigateSetup={() => setCurrentView('profile_setup')}
                />
              )}
            </>
          )}
        </main>

        {/* 4. Bottom Tab Bar (docked at bottom when logged in and not in sub-view) */}
        {!isSubPage && user && (
          <IPhoneTabBar
            activeTab={activeTab}
            onChangeTab={handleTabChange}
          />
        )}

      </div>

    </div>
  )
}
