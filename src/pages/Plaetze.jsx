import { useState, useEffect, useCallback } from 'react'
import {
  MapPin,
  Plus,
  ChevronDown,
  ChevronUp,
  Home,
  Sun,
  DollarSign,
  Tag,
  Search,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTARTEN } from '../lib/constants'
import LoadingSpinner from '../components/LoadingSpinner'

const inputClass =
  'w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors'

function CourtCard({ court }) {
  return (
    <div className="bg-card rounded-2xl border border-white/5 p-5 hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base truncate">{court.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
            <p className="text-muted text-sm truncate">{court.address}</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Indoor/Outdoor */}
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${
            court.indoor
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}
        >
          {court.indoor ? (
            <>
              <Home className="w-3 h-3" />
              Halle
            </>
          ) : (
            <>
              <Sun className="w-3 h-3" />
              Draußen
            </>
          )}
        </span>

        {/* Free/Paid */}
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${
            court.free
              ? 'bg-primary/20 text-primary'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          <DollarSign className="w-3 h-3" />
          {court.free ? 'Kostenlos' : 'Kostenpflichtig'}
        </span>

        {/* Sports */}
        {(court.sports || []).slice(0, 3).map((sport) => (
          <span
            key={sport}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-white/10 text-muted"
          >
            <Tag className="w-3 h-3" />
            {sport}
          </span>
        ))}
        {(court.sports || []).length > 3 && (
          <span className="text-xs text-muted px-2 py-1">
            +{court.sports.length - 3} mehr
          </span>
        )}
      </div>

      {/* Added by */}
      {court.added_by_user && (
        <p className="text-muted text-xs">
          Hinzugefügt von{' '}
          <span className="text-white">{court.added_by_user.name}</span>
        </p>
      )}
    </div>
  )
}

export default function Plaetze() {
  const { user } = useAuth()
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sportFilter, setSportFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [form, setForm] = useState({
    name: '',
    address: '',
    sports: [],
    indoor: false,
    free: true,
  })
  const [formErrors, setFormErrors] = useState({})

  const fetchCourts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('courts')
        .select('*, added_by_user:users!added_by(name)')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setCourts(data || [])
    } catch (err) {
      console.error('Fehler beim Laden der Plätze:', err)
      setError('Plätze konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourts()
  }, [fetchCourts])

  const toggleSport = (sport) => {
    setForm((prev) => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter((s) => s !== sport)
        : [...prev.sports, sport],
    }))
  }

  const validateForm = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name ist erforderlich'
    if (!form.address.trim()) e.address = 'Adresse ist erforderlich'
    if (form.sports.length === 0) e.sports = 'Mindestens eine Sportart wählen'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateForm()
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('courts').insert({
        name: form.name.trim(),
        address: form.address.trim(),
        sports: form.sports,
        indoor: form.indoor,
        free: form.free,
        added_by: user.id,
      })

      if (insertError) throw insertError

      toast.success('Platz erfolgreich hinzugefügt!')
      setForm({ name: '', address: '', sports: [], indoor: false, free: true })
      setFormErrors({})
      setFormOpen(false)
      await fetchCourts()
    } catch (err) {
      console.error('Fehler:', err)
      toast.error('Platz konnte nicht hinzugefügt werden.')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter courts
  const filteredCourts = courts.filter((c) => {
    const matchesSport = sportFilter ? (c.sports || []).includes(sportFilter) : true
    const matchesSearch = searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    return matchesSport && matchesSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Plätze & Venues</h1>
          <p className="text-muted mt-1">
            Entdecke Sportplätze in deiner Stadt – von der Community kuratiert.
          </p>
        </div>
        {user && (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-2 bg-primary text-dark font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-green-400 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Platz hinzufügen
            {formOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Add court form */}
      {formOpen && user && (
        <div className="bg-card rounded-2xl border border-primary/20 p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-5">
            Neuen Platz hinzufügen
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">
                  Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  placeholder="z.B. Tempelhofer Sportanlage"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`${inputClass} ${formErrors.name ? 'border-red-500' : ''}`}
                  maxLength={100}
                />
                {formErrors.name && (
                  <p className="text-red-400 text-xs">{formErrors.name}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">
                  Adresse <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Straße, PLZ, Stadt"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={`${inputClass} ${formErrors.address ? 'border-red-500' : ''}`}
                  maxLength={200}
                />
                {formErrors.address && (
                  <p className="text-red-400 text-xs">{formErrors.address}</p>
                )}
              </div>
            </div>

            {/* Sports */}
            <div className="flex flex-col gap-2">
              <label className="text-white text-sm font-medium">
                Sportarten <span className="text-primary">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {SPORTARTEN.map((sport) => {
                  const selected = form.sports.includes(sport)
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleSport(sport)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        selected
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-dark border-white/10 text-muted hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {sport}
                    </button>
                  )
                })}
              </div>
              {formErrors.sports && (
                <p className="text-red-400 text-xs">{formErrors.sports}</p>
              )}
            </div>

            {/* Indoor / Outdoor & Free / Paid toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-dark rounded-xl border border-white/10">
                <div>
                  <p className="text-white text-sm font-medium">Ort</p>
                  <p className="text-muted text-xs mt-0.5">
                    {form.indoor ? 'Halle / Indoor' : 'Draußen / Outdoor'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, indoor: !form.indoor })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.indoor ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                  role="switch"
                  aria-checked={form.indoor}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.indoor ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-dark rounded-xl border border-white/10">
                <div>
                  <p className="text-white text-sm font-medium">Kosten</p>
                  <p className="text-muted text-xs mt-0.5">
                    {form.free ? 'Kostenlos' : 'Kostenpflichtig'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, free: !form.free })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.free ? 'bg-primary' : 'bg-yellow-500'
                  }`}
                  role="switch"
                  aria-checked={form.free}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.free ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-primary text-dark font-bold px-6 py-3 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Hinzufügen
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false)
                  setFormErrors({})
                }}
                className="px-6 py-3 border border-white/20 text-muted hover:text-white rounded-xl transition-colors text-sm"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Not logged in prompt */}
      {!user && (
        <div className="bg-card/50 border border-white/10 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
          <p className="text-muted text-sm">
            <span className="text-white font-medium">Platz kennen?</span> Melde dich
            an, um Spielstätten zur Community hinzuzufügen.
          </p>
          <a
            href="/login"
            className="shrink-0 bg-primary text-dark font-bold text-sm px-4 py-2 rounded-lg hover:bg-green-400 transition-colors"
          >
            Anmelden
          </a>
        </div>
      )}

      {/* Map placeholder */}
      <div className="bg-card rounded-2xl border border-white/10 h-48 flex flex-col items-center justify-center gap-2 mb-8">
        <MapPin className="w-12 h-12 text-primary/30" />
        <p className="text-white font-semibold">Karte kommt bald</p>
        <p className="text-muted text-sm">OpenStreetMap Integration in Arbeit</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Platz suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="bg-card border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary transition-colors min-w-[160px]"
        >
          <option value="">Alle Sportarten</option>
          {SPORTARTEN.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {(sportFilter || searchQuery) && (
          <button
            onClick={() => {
              setSportFilter('')
              setSearchQuery('')
            }}
            className="flex items-center gap-2 text-muted hover:text-white text-sm transition-colors px-2"
          >
            <RefreshCw className="w-4 h-4" />
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Courts list */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-5xl">😕</span>
          <p className="text-white font-semibold">{error}</p>
          <button
            onClick={fetchCourts}
            className="flex items-center gap-2 bg-primary text-dark font-bold px-5 py-2.5 rounded-xl hover:bg-green-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
        </div>
      ) : filteredCourts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-6xl">🏟️</span>
          <div>
            <p className="text-white font-bold text-xl mb-2">
              {courts.length === 0
                ? 'Noch keine Plätze eingetragen'
                : 'Keine Plätze gefunden'}
            </p>
            <p className="text-muted text-sm max-w-sm mx-auto">
              {courts.length === 0
                ? 'Sei die/der Erste und trage deinen Lieblingsplatz ein!'
                : 'Versuche es mit anderen Filtern.'}
            </p>
          </div>
          {user && courts.length === 0 && (
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 bg-primary text-dark font-bold px-5 py-2.5 rounded-xl hover:bg-green-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ersten Platz hinzufügen
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-muted text-sm mb-4">
            {filteredCourts.length} Platz/Plätze gefunden
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCourts.map((court) => (
              <CourtCard key={court.id} court={court} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
