import { useState, useEffect } from 'react'
import { Wifi, Battery } from 'lucide-react'

export default function IPhoneStatusBar({ dark = false }) {
  const [currentTime, setCurrentTime] = useState('9:41')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={`h-11 px-6 flex items-center justify-between text-xs font-semibold select-none z-30 transition-colors ${
        dark ? 'text-white' : 'text-gray-900'
      }`}
    >
      <span className="tracking-tight">{currentTime}</span>

      {/* Dynamic Island Pill indicator (for iPhone 15/16 Pro style) */}
      <div className="w-24 h-5 bg-black rounded-full mx-auto hidden sm:block shrink-0 shadow-inner" />

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Cellular Signal bars */}
        <div className="flex items-end gap-0.5 h-3">
          <span className="w-0.5 h-1 bg-current rounded-xs" />
          <span className="w-0.5 h-1.5 bg-current rounded-xs" />
          <span className="w-0.5 h-2 bg-current rounded-xs" />
          <span className="w-0.5 h-2.5 bg-current rounded-xs" />
        </div>
        <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
        <Battery className="w-4 h-4 stroke-[2.5]" />
      </div>
    </div>
  )
}
