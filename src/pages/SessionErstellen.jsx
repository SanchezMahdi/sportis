import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTARTEN, SKILL_LEVELS, GENDER_FILTERS } from '../lib/constants'

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

const inputClass =
  'w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors'

const inputErrorClass = 'border-red-500'

export default function SessionErstellen() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

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
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Zurück</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Session erstellen</h1>
        <p className="text-muted">
          Bringe Sportler:innen zusammen – fülle das Formular aus und los geht's!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Basic info */}
        <div className="bg-card rounded-2xl border border-white/10 p-6 flex flex-col gap-5">
          <h2 className="text-white font-bold text-lg border-b border-white/10 pb-3">
            Grundinfo
          </h2>

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
            <select
              value={form.sport}
              onChange={(e) => handleChange('sport', e.target.value)}
              className={`${inputClass} ${errors.sport ? inputErrorClass : ''}`}
            >
              <option value="">Sportart wählen...</option>
              {SPORTARTEN.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Beschreibung" hint="optional">
            <textarea
              placeholder="Beschreibe deine Session – was wird gespielt, was wird benötigt, was sollen Teilnehmer:innen wissen?"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              maxLength={1000}
              className={`${inputClass} resize-none`}
            />
            <p className="text-muted text-xs text-right">
              {form.description.length}/1000
            </p>
          </FormField>
        </div>

        {/* Date & Time */}
        <div className="bg-card rounded-2xl border border-white/10 p-6 flex flex-col gap-5">
          <h2 className="text-white font-bold text-lg border-b border-white/10 pb-3">
            Datum & Uhrzeit
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Datum" required error={errors.date}>
              <input
                type="date"
                min={today}
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`${inputClass} [color-scheme:dark] ${errors.date ? inputErrorClass : ''}`}
              />
            </FormField>

            <FormField label="Uhrzeit" required error={errors.time}>
              <input
                type="time"
                value={form.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className={`${inputClass} [color-scheme:dark] ${errors.time ? inputErrorClass : ''}`}
              />
            </FormField>
          </div>
        </div>

        {/* Location */}
        <div className="bg-card rounded-2xl border border-white/10 p-6 flex flex-col gap-5">
          <h2 className="text-white font-bold text-lg border-b border-white/10 pb-3">
            Ort
          </h2>

          <FormField label="Ort / Platzbeschreibung" required error={errors.location}>
            <input
              type="text"
              placeholder="z.B. Tempelhofer Feld, Berlin"
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className={`${inputClass} ${errors.location ? inputErrorClass : ''}`}
              maxLength={200}
            />
          </FormField>

          <FormField label="Genaue Adresse" hint="optional">
            <input
              type="text"
              placeholder="z.B. Tempelhofer Damm 1, 12101 Berlin"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={inputClass}
              maxLength={300}
            />
          </FormField>
        </div>

        {/* Session settings */}
        <div className="bg-card rounded-2xl border border-white/10 p-6 flex flex-col gap-5">
          <h2 className="text-white font-bold text-lg border-b border-white/10 pb-3">
            Session-Einstellungen
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FormField
              label="Max. Teilnehmer:innen"
              required
              error={errors.max_players}
            >
              <input
                type="number"
                min={2}
                max={100}
                value={form.max_players}
                onChange={(e) => handleChange('max_players', e.target.value)}
                className={`${inputClass} ${errors.max_players ? inputErrorClass : ''}`}
              />
            </FormField>

            <FormField label="Geschlecht" required error={errors.gender_filter}>
              <select
                value={form.gender_filter}
                onChange={(e) => handleChange('gender_filter', e.target.value)}
                className={`${inputClass} ${errors.gender_filter ? inputErrorClass : ''}`}
              >
                {GENDER_FILTERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Skill-Level" required error={errors.skill_level}>
              <select
                value={form.skill_level}
                onChange={(e) => handleChange('skill_level', e.target.value)}
                className={`${inputClass} ${errors.skill_level ? inputErrorClass : ''}`}
              >
                {SKILL_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Equipment toggle */}
          <div className="flex items-center justify-between p-4 bg-dark rounded-xl border border-white/10">
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
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-dark font-bold py-4 rounded-xl hover:bg-green-400 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-primary/20"
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
            className="flex items-center justify-center gap-2 border-2 border-white/20 text-white font-bold py-4 px-6 rounded-xl hover:border-primary hover:text-primary transition-colors"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
