import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Zap, CloudDrizzle } from 'lucide-react'

const WMO_CODES = {
  0: { label: 'Klar', icon: Sun, color: 'text-yellow-400' },
  1: { label: 'Meist klar', icon: Sun, color: 'text-yellow-400' },
  2: { label: 'Teils bewölkt', icon: Cloud, color: 'text-blue-300' },
  3: { label: 'Bewölkt', icon: Cloud, color: 'text-muted' },
  45: { label: 'Neblig', icon: Cloud, color: 'text-muted' },
  48: { label: 'Neblig', icon: Cloud, color: 'text-muted' },
  51: { label: 'Leichter Niesel', icon: CloudDrizzle, color: 'text-blue-400' },
  53: { label: 'Niesel', icon: CloudDrizzle, color: 'text-blue-400' },
  55: { label: 'Starker Niesel', icon: CloudDrizzle, color: 'text-blue-400' },
  61: { label: 'Leichter Regen', icon: CloudRain, color: 'text-blue-400' },
  63: { label: 'Regen', icon: CloudRain, color: 'text-blue-500' },
  65: { label: 'Starker Regen', icon: CloudRain, color: 'text-blue-600' },
  71: { label: 'Schnee', icon: CloudSnow, color: 'text-blue-200' },
  73: { label: 'Schneefall', icon: CloudSnow, color: 'text-blue-200' },
  75: { label: 'Starker Schnee', icon: CloudSnow, color: 'text-blue-200' },
  80: { label: 'Schauer', icon: CloudRain, color: 'text-blue-400' },
  81: { label: 'Regenschauer', icon: CloudRain, color: 'text-blue-500' },
  82: { label: 'Starke Schauer', icon: CloudRain, color: 'text-blue-600' },
  95: { label: 'Gewitter', icon: Zap, color: 'text-yellow-500' },
  96: { label: 'Gewitter', icon: Zap, color: 'text-yellow-500' },
  99: { label: 'Heftiges Gewitter', icon: Zap, color: 'text-yellow-600' },
}

function getWeather(code) {
  return WMO_CODES[code] || WMO_CODES[3]
}

export default function WeatherWidget({ lat, lng, date }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lat || !lng || !date) { setLoading(false); return }

    const today = new Date().toISOString().split('T')[0]
    const target = date

    // Only fetch for future or today
    if (target < today) { setLoading(false); return }

    // Open-Meteo: free, no API key
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=Europe%2FBerlin&start_date=${target}&end_date=${target}`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.daily?.weathercode?.[0] !== undefined) {
          setWeather({
            code: data.daily.weathercode[0],
            maxTemp: Math.round(data.daily.temperature_2m_max[0]),
            minTemp: Math.round(data.daily.temperature_2m_min[0]),
            rain: data.daily.precipitation_probability_max[0],
            wind: Math.round(data.daily.windspeed_10m_max[0]),
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lat, lng, date])

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-white/10 p-5 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-10 bg-white/10 rounded w-3/4" />
      </div>
    )
  }

  if (!weather) return null

  const { icon: Icon, label, color } = getWeather(weather.code)

  return (
    <div className="bg-card rounded-2xl border border-white/10 p-5">
      <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
        Wetter am Spieltag
      </h3>
      <div className="flex items-center gap-4">
        <Icon className={`w-10 h-10 shrink-0 ${color}`} />
        <div className="flex-1">
          <p className={`font-bold text-lg ${color}`}>{label}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-white text-sm font-semibold">
              {weather.maxTemp}° / {weather.minTemp}°C
            </span>
            {weather.rain > 0 && (
              <span className="text-blue-400 text-xs flex items-center gap-1">
                <CloudRain className="w-3 h-3" /> {weather.rain}%
              </span>
            )}
            <span className="text-muted text-xs flex items-center gap-1">
              <Wind className="w-3 h-3" /> {weather.wind} km/h
            </span>
          </div>
        </div>
      </div>
      {weather.rain >= 70 && (
        <p className="text-yellow-400 text-xs mt-3 bg-yellow-500/10 px-3 py-2 rounded-lg">
          ⚠️ Hohes Regenrisiko — prüfe ob die Session stattfindet.
        </p>
      )}
    </div>
  )
}
