import { Home, Search, CalendarCheck, User } from 'lucide-react'

export default function IPhoneTabBar({ activeTab, onChangeTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'suche', label: 'Suche', icon: Search },
    { id: 'events', label: 'Events', icon: CalendarCheck },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 px-6 pt-2 pb-6 z-40 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between max-w-sm mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className="relative flex flex-col items-center justify-center w-16 py-1 group transition-all"
            >
              {/* Figma Active Top Indicator Bar */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-[#0B0D17] rounded-full animate-fade-in" />
              )}

              <Icon
                className={`w-6 h-6 transition-all duration-200 ${
                  isActive
                    ? 'text-gray-950 stroke-[2.4] scale-105'
                    : 'text-gray-400 stroke-[1.8] group-hover:text-gray-700'
                }`}
              />

              <span
                className={`text-[11px] mt-1 font-medium transition-colors ${
                  isActive ? 'text-gray-950 font-bold' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* iOS Home Indicator line */}
      <div className="w-32 h-1 bg-gray-300 rounded-full mx-auto mt-2 opacity-80" />
    </nav>
  )
}
