import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin, Plus, ChevronDown, ChevronUp,
  Home, Sun, DollarSign, Search, RefreshCw, Locate, Loader, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTARTEN, SPORT_EMOJIS } from '../lib/constants'
import LoadingSpinner from '../components/LoadingSpinner'

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const GERMANY_CENTER = [51.1657, 10.4515]

// OSM sport tag → our sport label
const OSM_SPORT_MAP = {
  soccer: 'Fußball', football: 'Fußball',
  tennis: 'Tennis',
  basketball: 'Basketball',
  volleyball: 'Volleyball',
  padel: 'Padel',
  badminton: 'Badminton',
  table_tennis: 'Tischtennis',
  field_hockey: 'Hockey', hockey: 'Hockey',
  rugby: 'Rugby', rugby_union: 'Rugby',
}

// OSM leisure/amenity tag → label
const OSM_TYPE_LABEL = {
  pitch: 'Sportplatz',
  sports_centre: 'Sportzentrum',
  stadium: 'Stadion',
  sports_hall: 'Sporthalle',
  fitness_centre: 'Fitnessstudio',
  ice_rink: 'Eislaufbahn',
  bowling_alley: 'Bowling',
  swimming_pool: 'Schwimmbad',
}

// Emoji fallback per type
const TYPE_EMOJIS = {
  pitch: '⚽',
  sports_centre: '🏟️',
  stadium: '🏟️',
  sports_hall: '🏀',
  fitness_centre: '💪',
  ice_rink: '⛸️',
  bowling_alley: '🎳',
  swimming_pool: '🏊',
}

const SPORT_COLORS = {
  'Fußball': '#22C55E',
  'Tennis': '#3B82F6',
  'Basketball': '#F97316',
  'Volleyball': '#8B5CF6',
  'Padel': '#EC4899',
  'Badminton': '#EAB308',
  'Tischtennis': '#14B8A6',
  'Hockey': '#6366F1',
  'Rugby': '#EF4444',
  'Sportzentrum': '#60A5FA',
  'Sporthalle': '#A78BFA',
  'Stadion': '#F87171',
  'Sportplatz': '#4ADE80',
  'Fitnessstudio': '#FB923C',
  'Eislaufbahn': '#67E8F9',
  'Bowling': '#C084FC',
  'Schwimmbad': '#38BDF8',
  'Sonstige': '#94A3B8',
}

// ---------- Quality filter ----------

// Keywords that indicate a non-sport venue (yoga studios, massage, wellness etc.)
const NON_SPORT_KEYWORDS = [
  // Wellness / Körperpflege
  'yoga', 'massage', 'wellness', 'spa', 'sauna', 'pilates', 'meditation',
  'ayurveda', 'kosmetik', 'beauty', 'physio', 'therapie', 'heilpraktiker',
  // Medizin
  'praxis', 'klinik', 'arzt', 'zahnarzt', 'optiker', 'apotheke', 'krankenhaus',
  // Tanz / Unterhaltung
  'tanz', 'ballet', 'ballett', 'zumba', 'dance studio', 'tanzkurs', 'tanzschule',
  'karaoke', 'casino', 'spielhalle',
  // Kinder-Spielplätze / Schulhöfe (keine Sportstätten)
  'spielplatz', 'schulhof', 'kindergarten', 'kindertagesstätte', 'kita',
  // Privat / nicht öffentlich
  'privat', 'private', 'intern', 'mitglieder',
  // Gastronomie
  'restaurant', 'café', 'bistro', 'bar ', 'lounge',
]

function isRealSportsVenue(name, sport, leisureType) {
  // Unnamed pitch WITHOUT sport tag = generic park corner, skip
  // But unnamed pitch WITH sport tag (e.g. soccer field) is valid!
  if (!name && !sport && leisureType === 'pitch') return false

  // If name contains non-sport keywords AND has no recognised sport tag → skip
  const nameLower = (name || '').toLowerCase()
  const looksLikeNonSport = NON_SPORT_KEYWORDS.some(kw => nameLower.includes(kw))
  if (looksLikeNonSport && !sport) return false

  return true
}

// ---------- Overpass API ----------

async function fetchSportsVenues(bounds) {
  const { _southWest: sw, _northEast: ne } = bounds
  const bbox = `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`
  const query = `
    [out:json][timeout:25];
    (
      way["leisure"="pitch"]["sport"](${bbox});
      way["leisure"="sports_centre"](${bbox});
      way["leisure"="stadium"](${bbox});
      way["leisure"="fitness_centre"](${bbox});
      way["leisure"="ice_rink"](${bbox});
      way["leisure"="bowling_alley"](${bbox});
      way["amenity"="swimming_pool"]["name"](${bbox});
      node["leisure"="sports_centre"](${bbox});
      node["leisure"="fitness_centre"](${bbox});
      node["amenity"="swimming_pool"]["name"](${bbox});
      node["leisure"="ice_rink"](${bbox});
    );
    out center tags;
  `
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  })
  const data = await res.json()
  return (data.elements || []).map(el => {
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (!lat || !lng) return null
    const tags = el.tags || {}
    const sportRaw = tags.sport || ''
    // OSM allows multiple sports separated by ";" — take first
    const firstSport = sportRaw.split(';')[0].trim()
    const sport = OSM_SPORT_MAP[firstSport] || null
    const leisureType = tags.leisure || tags.amenity || 'pitch'
    const typeLabel = OSM_TYPE_LABEL[leisureType] || 'Sportstätte'
    const name = tags.name || null

    if (!isRealSportsVenue(name, sport, leisureType)) return null

    // Unnamed pitch with sport → show sport name (e.g. "Fußballplatz"), else type label
    const displayName = name || (sport ? `${sport}platz` : typeLabel)
    const color = SPORT_COLORS[sport] || SPORT_COLORS[typeLabel] || SPORT_COLORS['Sonstige']
    const emoji = sport ? (SPORT_EMOJIS[sport] || '🏅') : TYPE_EMOJIS[leisureType] || '🏟️'
    return { id: `osm-${el.id}`, lat, lng, name: displayName, sport, typeLabel, color, emoji, tags }
  }).filter(Boolean)
}

// ---------- Geo helper ----------

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// ---------- Marker factories ----------

function makeVenueIcon(color, emoji, selected = false) {
  const w = selected ? 46 : 38
  const h = selected ? 56 : 46
  const fs = selected ? 20 : 16
  const glow = selected ? `drop-shadow(0 0 6px ${color})` : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
  return L.divIcon({
    html: `
      <div style="position:relative;width:${w}px;height:${h}px;filter:${glow};cursor:pointer;">
        <!-- Pin body -->
        <div style="
          width:${w}px;height:${w}px;border-radius:${w/2}px ${w/2}px ${w/2}px 0;
          transform:rotate(-45deg);
          background:${color};
          border:3px solid rgba(255,255,255,0.95);
          box-shadow:0 4px 16px rgba(0,0,0,0.35);
          position:absolute;top:0;left:0;
        "></div>
        <!-- Emoji centered in pin -->
        <div style="
          position:absolute;top:0;left:0;
          width:${w}px;height:${w}px;
          display:flex;align-items:center;justify-content:center;
          font-size:${fs}px;
        ">${emoji}</div>
      </div>`,
    className: '',
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -(h + 4)],
  })
}

function makeUserIcon() {
  return L.divIcon({
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div class="sportis-user-pulse" style="
          position:absolute;inset:-8px;border-radius:50%;
          background:rgba(34,197,94,0.35);
        "></div>
        <div style="
          width:20px;height:20px;border-radius:50%;
          background:#22C55E;border:3px solid #fff;
          box-shadow:0 2px 10px rgba(0,0,0,0.5);
        "></div>
      </div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

// ---------- Map inner components ----------

function MapInit() {
  const map = useMap()
  useEffect(() => { setTimeout(() => map.invalidateSize(), 100) }, [map])
  return null
}

function MapFlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 17, { duration: 0.8 })
  }, [target, map])
  return null
}

const MIN_ZOOM = 12  // Overpass only works for city-sized areas

function BoundsWatcher({ onBoundsChange, onZoomChange }) {
  const map = useMapEvents({
    moveend: () => {
      if (map.getZoom() >= MIN_ZOOM) onBoundsChange(map.getBounds())
    },
    zoomend: () => {
      onZoomChange(map.getZoom())
      if (map.getZoom() >= MIN_ZOOM) onBoundsChange(map.getBounds())
    },
  })
  useEffect(() => {
    onZoomChange(map.getZoom())
    if (map.getZoom() >= MIN_ZOOM) onBoundsChange(map.getBounds())
  }, [])
  return null
}

function VenuesMap({ venues, userLocation, radiusKm, selectedId, flyTarget, onBoundsChange, onZoomChange, onMarkerClick, onReportVenue }) {
  const center = userLocation ? [userLocation.lat, userLocation.lng] : GERMANY_CENTER
  const zoom = userLocation ? 14 : 6

  return (
    <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '480px' }} scrollWheelZoom>
      {/* CartoDB Voyager tiles — clean, modern, readable */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      <MapInit />
      <MapFlyTo target={flyTarget} />
      <BoundsWatcher onBoundsChange={onBoundsChange} onZoomChange={onZoomChange} />

      {userLocation && (
        <>
          <Marker position={[userLocation.lat, userLocation.lng]} icon={makeUserIcon()} zIndexOffset={1000} />
          {radiusKm > 0 && (
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: '#22C55E', fillColor: '#22C55E', fillOpacity: 0.06, weight: 1.5, dashArray: '6 4' }}
            />
          )}
        </>
      )}

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        iconCreateFunction={cluster => L.divIcon({
          html: `<div style="
            width:40px;height:40px;border-radius:50%;
            background:#22C55E;color:#0f172a;
            display:flex;align-items:center;justify-content:center;
            font-weight:800;font-size:14px;
            border:3px solid rgba(255,255,255,0.9);
            box-shadow:0 3px 12px rgba(0,0,0,0.5);
          ">${cluster.getChildCount()}</div>`,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })}
      >
      {venues.map(v => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={makeVenueIcon(v.color, v.emoji, v.id === selectedId)}
          eventHandlers={{ click: () => onMarkerClick(v) }}
        >
          <Popup>
            <div style={{ minWidth: '190px', fontFamily: 'Inter, sans-serif' }}>
              <p style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '4px' }}>{v.name}</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <span style={{ background: `${v.color}22`, color: v.color, border: `1px solid ${v.color}44`, borderRadius: '8px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
                  {v.emoji} {v.sport || v.typeLabel}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8', borderRadius: '8px', padding: '2px 8px', fontSize: '11px' }}>
                  {v.typeLabel}
                </span>
              </div>
              {v.tags?.surface && (
                <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Untergrund: {v.tags.surface}</p>
              )}
              {v.tags?.opening_hours && (
                <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '10px' }}>🕐 {v.tags.opening_hours}</p>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#22C55E', color: '#0f172a',
                  fontWeight: 700, fontSize: '12px',
                  padding: '6px 14px', borderRadius: '8px',
                  textDecoration: 'none', marginTop: '4px',
                }}
              >
                🗺️ In Google Maps öffnen
              </a>
              <button
                onClick={() => onReportVenue(v)}
                style={{
                  display: 'block', marginTop: '8px', background: 'none',
                  border: 'none', color: '#64748B', fontSize: '11px',
                  cursor: 'pointer', padding: '0', textDecoration: 'underline',
                }}
              >
                ⚑ Platz existiert nicht / falsch
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}

// ---------- Court list card (user-submitted) ----------

const inputClass = 'w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors'

function CourtCard({ court }) {
  return (
    <div className="bg-card rounded-2xl border border-white/5 p-5 hover:border-primary/20 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base truncate">{court.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
            <p className="text-muted text-sm truncate">{court.address}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${court.indoor ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
          {court.indoor ? <Home className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
          {court.indoor ? 'Halle' : 'Draußen'}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${court.free ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-400'}`}>
          <DollarSign className="w-3 h-3" />
          {court.free ? 'Kostenlos' : 'Kostenpflichtig'}
        </span>
        {(court.sports || []).slice(0, 3).map(s => (
          <span key={s} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-white/10 text-muted">
            {SPORT_EMOJIS[s]} {s}
          </span>
        ))}
      </div>
      {court.added_by_user && (
        <p className="text-muted text-xs mt-3">Hinzugefügt von <span className="text-white">{court.added_by_user.name}</span></p>
      )}
    </div>
  )
}

// ---------- Main page ----------

const RADIUS_OPTIONS = [
  { label: 'Alle', value: 0 },
  { label: '2 km', value: 2 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
]

export default function Plaetze() {
  const { user } = useAuth()
  const [courts, setCourts] = useState([])
  const [courtsLoading, setCourtsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sportFilter, setSportFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Map state
  const [venues, setVenues] = useState([])
  const [mapLoading, setMapLoading] = useState(false)
  const [mapZoom, setMapZoom] = useState(6)
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [radiusKm, setRadiusKm] = useState(0)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const lastBoundsRef = useRef(null)
  const [blacklist, setBlacklist] = useState(new Set())

  // Load blacklisted OSM venue IDs from Supabase
  useEffect(() => {
    supabase.from('reported_osm_venues').select('osm_id').then(({ data }) => {
      if (data) setBlacklist(new Set(data.map(r => r.osm_id)))
    })
  }, [])

  const [form, setForm] = useState({ name: '', address: '', sports: [], indoor: false, free: true })
  const [formErrors, setFormErrors] = useState({})

  // Load user-submitted courts
  const fetchCourts = useCallback(async () => {
    setCourtsLoading(true)
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*, added_by_user:users!added_by(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCourts(data || [])
    } catch {
      toast.error('Plätze konnten nicht geladen werden.')
    } finally {
      setCourtsLoading(false)
    }
  }, [])

  useEffect(() => { fetchCourts() }, [fetchCourts])

  // Fetch real OSM venues when map bounds change
  const handleBoundsChange = useCallback(async (bounds) => {
    lastBoundsRef.current = bounds
    setMapLoading(true)
    try {
      const results = await fetchSportsVenues(bounds)
      // If radius filter active, filter by distance
      if (radiusKm > 0 && userLocation) {
        const filtered = results.filter(v =>
          haversine(userLocation.lat, userLocation.lng, v.lat, v.lng) <= radiusKm
        )
        setVenues(filtered)
      } else {
        setVenues(results)
      }
    } catch (err) {
      console.warn('Overpass error:', err)
      toast.error('Karte konnte nicht geladen werden. Bitte neu laden.', { id: 'overpass-err', duration: 3000 })
    } finally {
      setMapLoading(false)
    }
  }, [radiusKm, userLocation])

  // Re-filter when radius changes
  useEffect(() => {
    if (lastBoundsRef.current) handleBoundsChange(lastBoundsRef.current)
  }, [radiusKm, handleBoundsChange])

  function handleLocate() {
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }
    setLocating(true)
    setLocationError(false)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setFlyTarget({ ...loc, _t: Date.now() })
        setLocating(false)
        setLocationError(false)
      },
      () => {
        setLocating(false)
        setLocationError(true)
      },
      { timeout: 10000 }
    )
  }

  async function handleManualLocation(e) {
    e.preventDefault()
    if (!manualAddress.trim()) return
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualAddress)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'de' } }
      )
      const data = await res.json()
      if (!data.length) { toast.error('Ort nicht gefunden. Bitte anders eingeben.'); return }
      const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      setUserLocation(loc)
      setFlyTarget({ ...loc, _t: Date.now() })
      setLocationError(false)
      setManualAddress('')
      toast.success(`Standort gesetzt: ${data[0].display_name.split(',')[0]}`)
    } catch {
      toast.error('Geocoding fehlgeschlagen.')
    } finally {
      setGeocoding(false)
    }
  }

  function handleVenueClick(venue) {
    setSelectedVenue(venue)
    setFlyTarget({ lat: venue.lat, lng: venue.lng, _t: Date.now() })
  }

  // Filtered venues for sport filter
  const displayedVenues = venues.filter(v => {
    if (blacklist.has(v.id)) return false
    if (!sportFilter) return true
    return v.sport === sportFilter || v.typeLabel === sportFilter
  })

  // Filtered user courts
  const filteredCourts = courts.filter(c => {
    const matchSport = sportFilter ? (c.sports || []).includes(sportFilter) : true
    const matchSearch = searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    return matchSport && matchSearch
  })

  const toggleSport = s => setForm(prev => ({
    ...prev,
    sports: prev.sports.includes(s) ? prev.sports.filter(x => x !== s) : [...prev.sports, s],
  }))

  const validateForm = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name ist erforderlich'
    if (!form.address.trim()) e.address = 'Adresse ist erforderlich'
    if (form.sports.length === 0) e.sports = 'Mindestens eine Sportart wählen'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validateForm()
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('courts').insert({
        name: form.name.trim(), address: form.address.trim(),
        sports: form.sports, indoor: form.indoor, free: form.free, added_by: user.id,
      })
      if (error) throw error
      toast.success('Platz hinzugefügt!')
      setForm({ name: '', address: '', sports: [], indoor: false, free: true })
      setFormErrors({})
      setFormOpen(false)
      fetchCourts()
    } catch {
      toast.error('Platz konnte nicht gespeichert werden.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReportVenue(venue) {
    if (!user) { toast.error('Bitte zuerst anmelden.'); return }
    const { error } = await supabase.from('reported_osm_venues').insert({
      osm_id: venue.id,
      name: venue.name,
      reported_by: user.id,
    })
    if (error && error.code !== '23505') {
      toast.error('Meldung fehlgeschlagen.')
      return
    }
    setBlacklist(prev => new Set([...prev, venue.id]))
    setSelectedVenue(null)
    toast.success('Platz wurde gemeldet und ausgeblendet.')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Plätze & Venues</h1>
          <p className="text-muted mt-1">Echte Sportstätten aus OpenStreetMap – direkt in deiner Nähe.</p>
        </div>
        {user && (
          <button onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-2 bg-primary text-dark font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-green-400 transition-colors shrink-0">
            <Plus className="w-4 h-4" />
            Platz hinzufügen
            {formOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Add form */}
      {formOpen && user && (
        <div className="bg-card rounded-2xl border border-primary/20 p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-5">Neuen Platz hinzufügen</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">Name <span className="text-primary">*</span></label>
                <input type="text" placeholder="z.B. Tempelhofer Sportanlage" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={`${inputClass} ${formErrors.name ? 'border-red-500' : ''}`} maxLength={100} />
                {formErrors.name && <p className="text-red-400 text-xs">{formErrors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">Adresse <span className="text-primary">*</span></label>
                <input type="text" placeholder="Straße, PLZ, Stadt" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className={`${inputClass} ${formErrors.address ? 'border-red-500' : ''}`} maxLength={200} />
                {formErrors.address && <p className="text-red-400 text-xs">{formErrors.address}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white text-sm font-medium">Sportarten <span className="text-primary">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {SPORTARTEN.map(s => (
                  <button key={s} type="button" onClick={() => toggleSport(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      form.sports.includes(s)
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-dark border-white/10 text-muted hover:border-white/30 hover:text-white'
                    }`}>{SPORT_EMOJIS[s]} {s}</button>
                ))}
              </div>
              {formErrors.sports && <p className="text-red-400 text-xs">{formErrors.sports}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Ort', sub: form.indoor ? 'Halle / Indoor' : 'Draußen / Outdoor', key: 'indoor', color: 'bg-blue-500' },
                { label: 'Kosten', sub: form.free ? 'Kostenlos' : 'Kostenpflichtig', key: 'free', color: 'bg-primary' },
              ].map(({ label, sub, key, color }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-dark rounded-xl border border-white/10">
                  <div><p className="text-white text-sm font-medium">{label}</p><p className="text-muted text-xs mt-0.5">{sub}</p></div>
                  <button type="button" onClick={() => setForm({ ...form, [key]: !form[key] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form[key] ? color : 'bg-white/20'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 bg-primary text-dark font-bold px-6 py-3 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50">
                {submitting ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Hinzufügen
              </button>
              <button type="button" onClick={() => { setFormOpen(false); setFormErrors({}) }}
                className="px-6 py-3 border border-white/20 text-muted hover:text-white rounded-xl transition-colors text-sm">
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {!user && (
        <div className="bg-card/50 border border-white/10 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
          <p className="text-muted text-sm"><span className="text-white font-medium">Platz kennen?</span> Melde dich an, um Spielstätten hinzuzufügen.</p>
          <a href="/login" className="shrink-0 bg-primary text-dark font-bold text-sm px-4 py-2 rounded-lg hover:bg-green-400 transition-colors">Anmelden</a>
        </div>
      )}

      {/* ===== MAP SECTION ===== */}
      <div className="mb-10">
        {/* Map toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-white font-bold text-lg">Sportstätten in der Nähe</h2>
            {mapLoading && <Loader className="w-4 h-4 text-muted animate-spin" />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sport filter chips */}
            <div className="flex gap-1 bg-card rounded-xl p-1 border border-white/5">
              <button onClick={() => setSportFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!sportFilter ? 'bg-primary text-dark' : 'text-muted hover:text-white'}`}>
                Alle
              </button>
              {['Fußball', 'Tennis', 'Basketball', 'Volleyball'].map(s => (
                <button key={s} onClick={() => setSportFilter(sportFilter === s ? '' : s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sportFilter === s ? 'bg-primary text-dark' : 'text-muted hover:text-white'}`}>
                  {SPORT_EMOJIS[s]}
                </button>
              ))}
            </div>

            {/* Radius filter */}
            {userLocation && (
              <div className="flex gap-1 bg-card rounded-xl p-1 border border-white/5">
                {RADIUS_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setRadiusKm(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${radiusKm === opt.value ? 'bg-primary text-dark' : 'text-muted hover:text-white'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Locate */}
            <button onClick={handleLocate} disabled={locating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50 ${
                userLocation ? 'bg-primary/20 border-primary text-primary' : 'bg-card border-white/10 text-muted hover:text-white'
              }`}>
              {locating
                ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                : <Locate className="w-3 h-3" />}
              {userLocation ? 'Standort aktiv' : 'Mein Standort'}
            </button>
          </div>
        </div>

        {/* Location error help */}
        {locationError && (
          <div className="bg-card border border-yellow-500/30 rounded-2xl p-4 mb-3">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">Standortzugriff nicht möglich</p>
                <p className="text-muted text-xs">Erlaube den Standort im Browser oder gib deinen Ort manuell ein.</p>
              </div>
              <button onClick={() => setLocationError(false)} className="text-muted hover:text-white shrink-0 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Browser instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {[
                { name: 'Chrome', icon: '🌐', steps: 'Adressleiste → Schloss-Symbol → Standort → Zulassen' },
                { name: 'Firefox', icon: '🦊', steps: 'Adressleiste → Schloss-Symbol → Berechtigungen → Standort erlauben' },
                { name: 'Safari', icon: '🧭', steps: 'Einstellungen → Websites → Standort → Diese Website zulassen' },
              ].map(b => (
                <div key={b.name} className="bg-dark/50 rounded-xl p-3 border border-white/5">
                  <p className="text-white text-xs font-semibold mb-1">{b.icon} {b.name}</p>
                  <p className="text-muted text-xs leading-relaxed">{b.steps}</p>
                </div>
              ))}
            </div>

            {/* Manual input */}
            <p className="text-muted text-xs mb-2 font-medium">Oder Ort manuell eingeben:</p>
            <form onSubmit={handleManualLocation} className="flex gap-2">
              <input
                type="text"
                value={manualAddress}
                onChange={e => setManualAddress(e.target.value)}
                placeholder="z.B. München, Berlin Mitte, ..."
                className="flex-1 bg-dark border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={geocoding || !manualAddress.trim()}
                className="flex items-center gap-1.5 bg-primary text-dark font-bold text-sm px-4 py-2 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {geocoding
                  ? <div className="w-3.5 h-3.5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                  : <Search className="w-3.5 h-3.5" />}
                Suchen
              </button>
            </form>
          </div>
        )}

        {/* Selected venue info */}
        {selectedVenue && (
          <div className="flex items-center justify-between bg-card border border-white/10 rounded-xl px-4 py-3 mb-3 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedVenue.emoji}</span>
              <div>
                <p className="text-white font-semibold text-sm">{selectedVenue.name}</p>
                <p className="text-muted text-xs">{selectedVenue.typeLabel} · {selectedVenue.sport || 'Mehrzweck'}</p>
              </div>
            </div>
            <button onClick={() => setSelectedVenue(null)} className="text-muted hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-white/10 relative">
          <VenuesMap
            venues={displayedVenues}
            userLocation={userLocation}
            radiusKm={radiusKm}
            selectedId={selectedVenue?.id}
            flyTarget={flyTarget}
            onBoundsChange={handleBoundsChange}
            onZoomChange={setMapZoom}
            onMarkerClick={handleVenueClick}
            onReportVenue={handleReportVenue}
          />
          <div className="absolute top-3 left-3 z-[1000] bg-dark/85 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
            {mapLoading
              ? 'Lade Sportstätten...'
              : mapZoom < 12
              ? '🔍 Weiter reinzoomen um Sportstätten zu sehen'
              : displayedVenues.length === 1
              ? '1 Sportstätte'
              : `${displayedVenues.length} Sportstätten`}
          </div>
        </div>

        <p className="text-muted text-xs mt-2 text-center">
          Daten von <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" className="text-primary hover:underline">OpenStreetMap</a> · Karte verschieben um mehr zu laden
        </p>
      </div>

      {/* ===== USER-SUBMITTED COURTS ===== */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4">Von der Community eingetragen</h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input type="text" placeholder="Platz suchen..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors" />
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="flex items-center gap-2 text-muted hover:text-white text-sm transition-colors px-2">
              <RefreshCw className="w-4 h-4" /> Zurücksetzen
            </button>
          )}
        </div>

        {courtsLoading ? (
          <LoadingSpinner />
        ) : filteredCourts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="text-5xl">🏟️</span>
            <p className="text-white font-bold text-lg">
              {courts.length === 0 ? 'Noch keine Plätze eingetragen' : 'Keine Plätze gefunden'}
            </p>
            <p className="text-muted text-sm">
              {courts.length === 0 ? 'Sei die/der Erste und füge einen Platz hinzu!' : 'Versuche andere Suchbegriffe.'}
            </p>
            {user && courts.length === 0 && (
              <button onClick={() => setFormOpen(true)}
                className="flex items-center gap-2 bg-primary text-dark font-bold px-5 py-2.5 rounded-xl hover:bg-green-400 transition-colors">
                <Plus className="w-4 h-4" /> Ersten Platz hinzufügen
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-muted text-sm mb-4">
              {filteredCourts.length === 1 ? '1 Platz' : `${filteredCourts.length} Plätze`} gefunden
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCourts.map(court => <CourtCard key={court.id} court={court} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
