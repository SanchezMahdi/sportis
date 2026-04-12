import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Filter, Plus, RefreshCw, List, Map, LocateFixed, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTARTEN, GENDER_FILTERS } from '../lib/constants'
import SessionCard from '../components/SessionCard'
import LoadingSpinner from '../components/LoadingSpinner'

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function Entdecken() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [geoLoading, setGeoLoading] = useState(false)
  const [userCoords, setUserCoords] = useState(null) // { lat, lng }
  const cityDebounce = useRef(null)

  // Filters
  const [filters, setFilters] = useState({
    sport: searchParams.get('sport') || '',
    city: searchParams.get('city') || '',
    gender: searchParams.get('gender') || '',
    date: searchParams.get('date') || '',
    radius: searchParams.get('radius') || '',
  })

  const [filtersOpen, setFiltersOpen] = useState(false)

  // Geocode city to lat/lng via Nominatim
  const geocodeCity = useCallback(async (city) => {
    if (!city || city.length < 2) { setUserCoords(null); return }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&countrycodes=de,at,ch`,
        { headers: { 'Accept-Language': 'de' } }
      )
      const data = await res.json()
      if (data[0]) setUserCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
      else setUserCoords(null)
    } catch { setUserCoords(null) }
  }, [])

  // Re-geocode when city filter changes (debounced)
  useEffect(() => {
    if (filters.radius && filters.city) {
      clearTimeout(cityDebounce.current)
      cityDebounce.current = setTimeout(() => geocodeCity(filters.city), 600)
    } else {
      setUserCoords(null)
    }
    return () => clearTimeout(cityDebounce.current)
  }, [filters.city, filters.radius, geocodeCity])

  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserCoords({ lat, lng })
        // Reverse geocode to city name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'de' } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          handleFilterChange('city', city)
          if (!filters.radius) handleFilterChange('radius', '10')
        } catch {}
        setGeoLoading(false)
      },
      () => setGeoLoading(false)
    )
  }

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          creator:users!creator_id(id, name, city, avatar_url),
          session_participants(user_id, waitlist)
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      const today = new Date().toISOString().split('T')[0]
      query = query.gte('date', today)

      if (filters.sport) query = query.eq('sport', filters.sport)
      if (!filters.radius && filters.city) query = query.ilike('location', `%${filters.city}%`)
      if (filters.gender) query = query.eq('gender_filter', filters.gender)
      if (filters.date) query = query.eq('date', filters.date)

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      let enriched = (data || []).map((s) => ({
        ...s,
        participant_count: s.session_participants?.filter(p => !p.waitlist).length ?? 0,
      }))

      // Client-side radius filter
      if (filters.radius && userCoords) {
        const km = parseFloat(filters.radius)
        enriched = enriched.filter(s => {
          if (!s.lat || !s.lng) return false
          return haversine(userCoords.lat, userCoords.lng, s.lat, s.lng) <= km
        }).map(s => ({
          ...s,
          _distance: haversine(userCoords.lat, userCoords.lng, s.lat, s.lng),
        })).sort((a, b) => a._distance - b._distance)
      }

      setSessions(enriched)
    } catch (err) {
      console.error('Fehler beim Laden der Sessions:', err)
      setError('Sessions konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [filters, userCoords])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('sessions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => {
          fetchSessions()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_participants' },
        () => {
          fetchSessions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchSessions])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => { if (v) params.set(k, v) })
    setSearchParams(params)
  }

  const clearFilters = () => {
    const empty = { sport: '', city: '', gender: '', date: '', radius: '' }
    setFilters(empty)
    setSearchParams({})
    setUserCoords(null)
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Sessions entdecken</h1>
          <p className="text-muted mt-1">
            {loading
              ? 'Lade Sessions...'
              : `${sessions.length} Session${sessions.length !== 1 ? 's' : ''} gefunden`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/session/erstellen"
            className="inline-flex items-center gap-2 bg-primary text-dark font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-green-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Session erstellen
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-card rounded-2xl border border-white/10 p-4 mb-6">
        {/* Mobile: toggle */}
        <div className="flex items-center justify-between md:hidden mb-3">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 text-white font-medium text-sm"
          >
            <Filter className="w-4 h-4 text-primary" />
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-primary text-dark text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-muted hover:text-white text-xs transition-colors"
            >
              Zurücksetzen
            </button>
          )}
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 ${filtersOpen ? 'block' : 'hidden md:grid'}`}>
          {/* Sport */}
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs font-medium uppercase tracking-wide">Sportart</label>
            <select
              value={filters.sport}
              onChange={(e) => handleFilterChange('sport', e.target.value)}
              className="bg-dark border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">Alle Sportarten</option>
              {SPORTARTEN.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* City */}
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs font-medium uppercase tracking-wide">Stadt / PLZ</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="z.B. Hamburg"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full bg-dark border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handleLocateMe}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-primary transition-colors"
                title="Meinen Standort nutzen"
              >
                {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Radius */}
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs font-medium uppercase tracking-wide">Umkreis</label>
            <select
              value={filters.radius}
              onChange={(e) => handleFilterChange('radius', e.target.value)}
              className="bg-dark border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">Kein Limit</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
            </select>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs font-medium uppercase tracking-wide">Geschlecht</label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              className="bg-dark border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">Alle</option>
              {GENDER_FILTERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs font-medium uppercase tracking-wide">Datum</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="bg-dark border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Desktop clear filters + view toggle */}
        <div className="hidden md:flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-4">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-muted hover:text-white text-sm transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Filter zurücksetzen ({activeFilterCount})
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-dark rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-dark'
                  : 'text-muted hover:text-white'
              }`}
              title="Listenansicht"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'map'
                  ? 'bg-primary text-dark'
                  : 'text-muted hover:text-white'
              }`}
              title="Kartenansicht"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Map placeholder */}
      {viewMode === 'map' && (
        <div className="bg-card rounded-2xl border border-white/10 h-72 flex flex-col items-center justify-center gap-3 mb-6">
          <Map className="w-16 h-16 text-primary/30" />
          <div className="text-center">
            <p className="text-white font-semibold">Karte kommt bald</p>
            <p className="text-muted text-sm mt-1">OpenStreetMap Integration in Arbeit</p>
          </div>
        </div>
      )}

      {/* Sessions grid */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-5xl">😕</span>
          <p className="text-white font-semibold">{error}</p>
          <button
            onClick={fetchSessions}
            className="flex items-center gap-2 bg-primary text-dark font-bold px-5 py-2.5 rounded-xl hover:bg-green-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-6xl">🏃</span>
          <div>
            <p className="text-white font-bold text-xl mb-2">
              Keine Sessions gefunden
            </p>
            <p className="text-muted text-sm max-w-sm mx-auto">
              {activeFilterCount > 0
                ? 'Versuche es mit anderen Filtern oder erstelle selbst eine Session.'
                : 'Sei der Erste! Erstelle eine Session und bringe Leute zusammen.'}
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="border border-white/20 text-white font-medium px-5 py-2.5 rounded-xl hover:border-primary hover:text-primary transition-colors text-sm"
              >
                Filter zurücksetzen
              </button>
            )}
            <Link
              to="/session/erstellen"
              className="flex items-center gap-2 bg-primary text-dark font-bold px-5 py-2.5 rounded-xl hover:bg-green-400 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Session erstellen
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
