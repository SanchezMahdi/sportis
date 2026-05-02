import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Info, MapPin, Loader2, Calendar, Clock, Users, Target, Minus } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTARTEN, SPORT_EMOJIS, SKILL_LEVELS, GENDER_FILTERS } from '../lib/constants'

const SPORT_LEISURE = new Set(['pitch', 'sports_centre', 'stadium', 'fitness_centre', 'swimming_pool', 'ice_rink', 'golf_course', 'track'])

function venueEmoji(s) {
  if (s.type === 'pitch') return '⚽'
  if (s.type === 'fitness_centre') return '💪'
  if (s.type === 'swimming_pool') return '🏊'
  if (s.type === 'stadium') return '🏟️'
  if (s.type === 'sports_centre') return '🏟️'
  if (s.class === 'leisure') return '🌳'
  if (s.class === 'natural') return '🌿'
  return '📍'
}

function formatSuggestion(s) {
  const parts = s.display_name.split(', ')
  const name = parts[0]
  const city = s.address?.city || s.address?.town || s.address?.village || s.address?.municipality || ''
  const state = s.address?.state || ''
  const sub = [city, state].filter(Boolean).join(', ')
  return { name, sub }
}

const initialForm = {
  title: '',
  sport: '',
  date: '',
  time: '',
  location: '',
  address: '',
  max_players: 10,
  gender_filter: 'Gemischt',
  skill_level: 'Mittel',
  description: '',
  equipment: false,
}

function FormField({ label, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-white text-sm font-medium">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
        {hint && (
          <span className="text-muted font-normal ml-2 text-xs">({hint})</span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <Info className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <section className="bg-card/95 rounded-2xl border border-white/10 p-5 sm:p-6 flex flex-col gap-5 shadow-xl shadow-black/10">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <h2 className="text-white font-black text-xl">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ChoiceButton({ active, children, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
        active
          ? 'bg-primary text-dark border-primary shadow-lg shadow-primary/20'
          : 'bg-dark/70 text-muted border-white/10 hover:border-white/25 hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  )
}

const inputClass =
  'w-full h-12 bg-dark/80 border border-white/10 rounded-xl px-4 text-white text-sm placeholder-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors'

const inputErrorClass = 'border-red-500'

export default function SessionErstellen() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)
  const suggestionRef = useRef(null)

  const [addrSuggestions, setAddrSuggestions] = useState([])
  const [addrSearching, setAddrSearching] = useState(false)
  const [showAddrSuggestions, setShowAddrSuggestions] = useState(false)
  const addrDebounceRef = useRef(null)
  const addrSuggestionRef = useRef(null)

  const searchAddresses = useCallback(async (query) => {
    if (query.length < 5) { setAddrSuggestions([]); return }
    setAddrSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=de&format=json&addressdetails=1&limit=6`,
        { headers: { 'Accept-Language': 'de' } }
      )
      const data = await res.json()
      setAddrSuggestions(data.slice(0, 6))
      setShowAddrSuggestions(true)
    } catch {
      setAddrSuggestions([])
    } finally {
      setAddrSearching(false)
    }
  }, [])

  const searchVenues = useCallback(async (query) => {
    if (query.length < 3) { setSuggestions([]); return }
    setSearching(true)
    try {
      const headers = { 'Accept-Language': 'de' }
      const base = `https://nominatim.openstreetmap.org/search?countrycodes=de&format=json&addressdetails=1&limit=6`
      const [r1, r2, r3] = await Promise.all([
        fetch(`${base}&q=${encodeURIComponent(query + ' Sportplatz')}`, { headers }),
        fetch(`${base}&q=${encodeURIComponent(query + ' Sportstätte')}`, { headers }),
        fetch(`${base}&q=${encodeURIComponent(query)}`, { headers }),
      ])
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()])

      // Merge, deduplicate, sports first
      const seen = new Set()
      const merged = []
      for (const item of [...d1, ...d2, ...d3]) {
        if (!seen.has(item.place_id)) {
          seen.add(item.place_id)
          merged.push(item)
        }
      }
      merged.sort((a, b) => Number(SPORT_LEISURE.has(b.type)) - Number(SPORT_LEISURE.has(a.type)))
      setSuggestions(merged.slice(0, 7))
      setShowSuggestions(true)
    } catch {
      setSuggestions([])
    } finally {
      setSearching(false)
    }
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) setShowSuggestions(false)
      if (addrSuggestionRef.current && !addrSuggestionRef.current.contains(e.target)) setShowAddrSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Bitte melde dich an, um eine Session zu erstellen.')
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Titel ist erforderlich'
    else if (form.title.trim().length < 3) e.title = 'Titel muss mindestens 3 Zeichen haben'
    if (!form.sport) e.sport = 'Sportart ist erforderlich'
    if (!form.date) e.date = 'Datum ist erforderlich'
    if (!form.time) e.time = 'Uhrzeit ist erforderlich'
    if (!form.location.trim()) e.location = 'Ort ist erforderlich'
    if (!form.max_players || form.max_players < 2)
      e.max_players = 'Mindestens 2 Spieler:innen'
    if (form.max_players > 100)
      e.max_players = 'Maximal 100 Spieler:innen'
    if (!form.gender_filter) e.gender_filter = 'Geschlecht-Filter ist erforderlich'
    if (!form.skill_level) e.skill_level = 'Level ist erforderlich'
    return e
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
    if (field === 'location') {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => searchVenues(value), 400)
    }
    if (field === 'address') {
      clearTimeout(addrDebounceRef.current)
      addrDebounceRef.current = setTimeout(() => searchAddresses(value), 400)
    }
  }

  const handleSelectAddress = (s) => {
    const a = s.address || {}
    const road = a.road || a.pedestrian || a.footway || ''
    const nr = a.house_number || ''
    const postcode = a.postcode || ''
    const city = a.city || a.town || a.village || a.municipality || ''
    const parts = [road + (nr ? ` ${nr}` : ''), postcode, city].filter(Boolean)
    setForm((prev) => ({ ...prev, address: parts.join(', ') }))
    setShowAddrSuggestions(false)
    setAddrSuggestions([])
  }

  const handleSelectSuggestion = (s) => {
    const { name } = formatSuggestion(s)
    const city = s.address?.city || s.address?.town || s.address?.village || ''
    const road = s.address?.road || s.address?.pedestrian || ''
    const nr = s.address?.house_number || ''
    const postcode = s.address?.postcode || ''
    const locationText = city && city !== name ? `${name}, ${city}` : name
    const addressParts = [road + (nr ? ` ${nr}` : ''), postcode, city].filter(Boolean)
    const addressText = addressParts.join(', ')
    setForm((prev) => ({ ...prev, location: locationText, address: addressText }))
    setShowSuggestions(false)
    setSuggestions([])
    if (errors.location) setErrors((prev) => { const next = { ...prev }; delete next.location; return next })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Bitte fülle alle Pflichtfelder aus.')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          creator_id: user.id,
          title: form.title.trim(),
          sport: form.sport,
          date: form.date,
          time: form.time,
          location: form.location.trim(),
          address: form.address.trim() || null,
          max_players: parseInt(form.max_players),
          gender_filter: form.gender_filter,
          skill_level: form.skill_level,
          description: form.description.trim() || null,
          equipment: form.equipment,
        })
        .select()
        .single()

      if (error) throw error

      // Also join the session as creator
      await supabase.from('session_participants').insert({
        session_id: data.id,
        user_id: user.id,
      })

      toast.success('Session erfolgreich erstellt! 🎉')
      navigate(`/session/${data.id}`)
    } catch (err) {
      console.error('Fehler beim Erstellen:', err)
      toast.error('Session konnte nicht erstellt werden. Bitte versuche es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Zurück</span>
      </button>

      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">Session erstellen</h1>
          <p className="text-muted text-base sm:text-lg max-w-2xl">
            Wähle Sportart, Zeit und Ort. Die wichtigsten Felder sind zuerst, Details bleiben optional.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-card/80 border border-white/10 rounded-2xl px-4 py-3">
          <span className="text-primary font-black text-2xl">{SPORTARTEN.length}</span>
          <span className="text-muted text-sm">Sportarten verfügbar</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Basic info */}
        <SectionCard icon={Target} title="Grundinfo">
          <FormField label="Titel" required error={errors.title}>
            <input
              type="text"
              placeholder="z.B. Fußball 5vs5 am Samstag"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`${inputClass} ${errors.title ? inputErrorClass : ''}`}
              maxLength={100}
            />
          </FormField>

          <FormField label="Sportart" required error={errors.sport}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {SPORTARTEN.map((sport) => (
                <ChoiceButton
                  key={sport}
                  active={form.sport === sport}
                  onClick={() => handleChange('sport', sport)}
                  className={errors.sport ? 'border-red-500' : ''}
                >
                  <span className="text-lg">{SPORT_EMOJIS[sport]}</span>
                  <span>{sport}</span>
                </ChoiceButton>
              ))}
            </div>
          </FormField>

          <FormField label="Beschreibung" hint="optional">
            <textarea
              placeholder="Beschreibe deine Session – was wird gespielt, was wird benötigt, was sollen Teilnehmer:innen wissen?"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              maxLength={1000}
              className={`${inputClass} h-32 resize-none py-3 leading-relaxed`}
            />
            <p className="text-muted text-xs text-right">
              {form.description.length}/1000
            </p>
          </FormField>
        </SectionCard>

        {/* Date & Time */}
        <SectionCard icon={Calendar} title="Datum & Uhrzeit">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Datum" required error={errors.date}>
              <div className="relative">
                <input
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={`${inputClass} [color-scheme:dark] ${errors.date ? inputErrorClass : ''}`}
                />
                <Calendar className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              </div>
            </FormField>

            <FormField label="Uhrzeit" required error={errors.time}>
              <div className="relative">
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  className={`${inputClass} [color-scheme:dark] ${errors.time ? inputErrorClass : ''}`}
                />
                <Clock className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              </div>
            </FormField>
          </div>
        </SectionCard>

        {/* Location */}
        <SectionCard icon={MapPin} title="Ort">
          <FormField label="Ort / Platzbeschreibung" required error={errors.location}>
            <div className="relative" ref={suggestionRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="z.B. Reinbek, Stadtpark Hamburg..."
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className={`${inputClass} pr-10 ${errors.location ? inputErrorClass : ''}`}
                  maxLength={200}
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                  {searching
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <MapPin className="w-4 h-4" />}
                </div>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-white/15 rounded-xl shadow-2xl overflow-hidden">
                  {suggestions.map((s, i) => {
                    const { name, sub } = formatSuggestion(s)
                    const isSport = SPORT_LEISURE.has(s.type)
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
                      >
                        <span className="text-lg shrink-0">{venueEmoji(s)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isSport ? 'text-primary font-medium' : 'text-white'}`}>
                            {name}
                          </p>
                          {sub && <p className="text-muted text-xs truncate">{sub}</p>}
                        </div>
                        {isSport && (
                          <span className="text-xs text-primary/70 shrink-0">Sportstätte</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </FormField>

          <FormField label="Genaue Adresse" hint="optional">
            <div className="relative" ref={addrSuggestionRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="z.B. Tempelhofer Damm 1, 12101 Berlin"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  onFocus={() => addrSuggestions.length > 0 && setShowAddrSuggestions(true)}
                  className={`${inputClass} pr-10`}
                  maxLength={300}
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                  {addrSearching
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <MapPin className="w-4 h-4" />}
                </div>
              </div>

              {showAddrSuggestions && addrSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-white/15 rounded-xl shadow-2xl overflow-hidden">
                  {addrSuggestions.map((s, i) => {
                    const a = s.address || {}
                    const road = a.road || a.pedestrian || a.footway || ''
                    const nr = a.house_number || ''
                    const postcode = a.postcode || ''
                    const city = a.city || a.town || a.village || ''
                    const line1 = road + (nr ? ` ${nr}` : '')
                    const line2 = [postcode, city].filter(Boolean).join(' ')
                    if (!line1 && !line2) return null
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectAddress(s)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
                      >
                        <MapPin className="w-4 h-4 text-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          {line1 && <p className="text-white text-sm truncate">{line1}</p>}
                          {line2 && <p className="text-muted text-xs truncate">{line2}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </FormField>
        </SectionCard>

        {/* Session settings */}
        <SectionCard icon={Users} title="Session-Einstellungen">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_1fr] gap-5">
            <FormField
              label="Max. Teilnehmer:innen"
              required
              error={errors.max_players}
            >
              <div className={`h-12 bg-dark/80 border rounded-xl flex items-center overflow-hidden ${
                errors.max_players ? inputErrorClass : 'border-white/10'
              }`}>
                <button
                  type="button"
                  onClick={() => handleChange('max_players', Math.max(2, Number(form.max_players || 2) - 1))}
                  className="h-full w-12 flex items-center justify-center text-muted hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={form.max_players}
                  onChange={(e) => handleChange('max_players', e.target.value)}
                  className="w-full bg-transparent text-center text-white font-bold text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => handleChange('max_players', Math.min(100, Number(form.max_players || 2) + 1))}
                  className="h-full w-12 flex items-center justify-center text-muted hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </FormField>

            <FormField label="Geschlecht" required error={errors.gender_filter}>
              <div className="grid grid-cols-3 gap-2">
                {GENDER_FILTERS.map((gender) => (
                  <ChoiceButton
                    key={gender}
                    active={form.gender_filter === gender}
                    onClick={() => handleChange('gender_filter', gender)}
                    className="min-w-0"
                  >
                    <span className="truncate">{gender.replace('Nur ', '')}</span>
                  </ChoiceButton>
                ))}
              </div>
            </FormField>

            <FormField label="Skill-Level" required error={errors.skill_level}>
              <div className="grid grid-cols-3 gap-2">
                {SKILL_LEVELS.map((level) => (
                  <ChoiceButton
                    key={level}
                    active={form.skill_level === level}
                    onClick={() => handleChange('skill_level', level)}
                    className="min-w-0"
                  >
                    <span className="truncate">{level}</span>
                  </ChoiceButton>
                ))}
              </div>
            </FormField>
          </div>

          {/* Equipment toggle */}
          <div className="flex items-center justify-between gap-4 p-4 bg-dark/80 rounded-xl border border-white/10">
            <div>
              <p className="text-white text-sm font-medium">Ausrüstung vorhanden?</p>
              <p className="text-muted text-xs mt-0.5">
                z.B. Ball, Netz, Schläger werden gestellt
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('equipment', !form.equipment)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.equipment ? 'bg-primary' : 'bg-white/20'
              }`}
              role="switch"
              aria-checked={form.equipment}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.equipment ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </SectionCard>

        {/* Submit */}
        <div className="sticky bottom-0 z-20 -mx-4 sm:mx-0 bg-dark/95 backdrop-blur-md border-t border-white/10 sm:border sm:border-white/10 sm:rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 min-h-14 flex items-center justify-center gap-2 bg-primary text-dark font-black rounded-xl hover:bg-green-400 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-primary/20"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                Session wird erstellt...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Session erstellen
              </>
            )}
          </button>

          <Link
            to="/entdecken"
            className="min-h-14 flex items-center justify-center gap-2 border border-white/20 text-white font-bold px-6 rounded-xl hover:border-primary hover:text-primary transition-colors"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
