import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, AlertCircle, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function SessionErstellen() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Form State
  const [level, setLevel] = useState('Anfänger') // 'Anfänger' | 'Mittel'
  const [equipmentRequired, setEquipmentRequired] = useState(false) // false = 'Nein' checked, true = 'Ja' checked
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState(false)
  const [university, setUniversity] = useState('')
  const [date, setDate] = useState('')
  const [dateError, setDateError] = useState(null)
  const [time, setTime] = useState('')
  const [ort, setOrt] = useState('Hamburg')
  const [address, setAddress] = useState('')
  const [sport, setSport] = useState('Fussball') // 'Fussball' | 'Basketball' | 'Vollyball'
  const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(true)

  const [submitting, setSubmitting] = useState(false)

  const validateDate = (val) => {
    if (!val) return 'Bitte Datum auswählen'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const parts = val.split('-').map(Number)
    if (parts.length !== 3) return 'Ungültiges Datum'
    const selected = new Date(parts[0], parts[1] - 1, parts[2])
    if (isNaN(selected.getTime())) return 'Ungültiges Datum'
    if (selected < today) return 'Datum darf nicht in der Vergangenheit liegen'
    return null
  }

  const handleDateChange = (val) => {
    setDate(val)
    if (!val) {
      setDateError(null)
      return
    }
    const err = validateDate(val)
    setDateError(err)
  }

  // Pre-fill date to today or valid date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setDate(today)
    setTime('18:00')
    setDateError(null)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    let hasError = false
    if (!title.trim()) {
      setTitleError(true)
      toast.error('Bitte gib einen Titel ein.')
      hasError = true
    } else {
      setTitleError(false)
    }

    const dateErr = validateDate(date)
    if (dateErr) {
      setDateError(dateErr)
      toast.error(dateErr)
      hasError = true
    } else {
      setDateError(null)
    }

    if (hasError) return

    setSubmitting(true)

    try {
      if (!user) {
        toast.error('Bitte melde dich an, um eine Session zu erstellen.')
        navigate('/login')
        return
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          creator_id: user.id,
          host_id: user.id,
          title: title.trim(),
          sport: sport.toLowerCase(),
          date: date,
          time: time || '18:00',
          location: ort,
          address: address || `${university || 'Campus'}, ${ort}`,
          max_players: 10,
          skill_level: level === 'Anfänger' ? 'beginner' : 'intermediate',
          gender_filter: 'Gemischt',
          equipment: equipmentRequired,
          description: `Universität: ${university || 'Sportis Community'}`,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        await supabase.from('session_participants').upsert(
          { session_id: data.id, user_id: user.id, waitlist: false, attended: true },
          { onConflict: 'session_id,user_id' }
        )
      }

      toast.success('Session erfolgreich erstellt! 🎉')
      navigate('/sessions')
    } catch (err) {
      console.error(err)
      toast.error('Session konnte nicht gespeichert werden: ' + (err?.message || ''))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-['Inter',sans-serif] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          {/* ────────────────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN: Skill Levels & Yes/No (Ice-Blue Background)           */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 bg-[#EAF2FE] p-6 sm:p-8 flex flex-col gap-8 justify-start">
            
            {/* 1. Skill Level Box (Anfänger / Mittel) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-800">
                Level
              </label>
              <div className="border border-dashed border-[#F6A94D] rounded-2xl p-4 flex flex-col gap-3 bg-white/40">
                <button
                  type="button"
                  onClick={() => setLevel('Anfänger')}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                    level === 'Anfänger'
                      ? 'bg-[#F6A94D] text-white shadow-xs font-semibold'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Anfänger
                </button>

                <button
                  type="button"
                  onClick={() => setLevel('Mittel')}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                    level === 'Mittel'
                      ? 'bg-[#F6A94D] text-white shadow-xs font-semibold'
                      : 'bg-white text-[#F6A94D] hover:bg-orange-50/50 border border-[#F6A94D]/30'
                  }`}
                >
                  Mittel
                </button>
              </div>
            </div>

            {/* 2. Yes / No Toggle Box (Ja / Nein) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-800">
                Ausrüstung vorhanden?
              </label>
              <div className="border border-dashed border-[#818CF8] rounded-2xl p-4 flex flex-col gap-3 bg-white/40">
                <button
                  type="button"
                  onClick={() => setEquipmentRequired(true)}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                    equipmentRequired
                      ? 'bg-blue-50 text-[#2563EB] border border-[#2563EB]'
                      : 'text-gray-700 hover:bg-white/60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    equipmentRequired ? 'border-[#2563EB] bg-[#2563EB] text-white' : 'border-gray-300 bg-white'
                  }`}>
                    {equipmentRequired && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span>Ja</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEquipmentRequired(false)}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                    !equipmentRequired
                      ? 'bg-blue-50/80 text-[#2563EB] border border-[#818CF8]'
                      : 'text-gray-700 hover:bg-white/60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    !equipmentRequired ? 'border-[#2563EB] bg-[#2563EB] text-white' : 'border-gray-300 bg-white'
                  }`}>
                    {!equipmentRequired && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span>Nein</span>
                </button>
              </div>
            </div>

          </div>

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* CENTER COLUMN: Titel, Universität, Date, Uhrzeit                  */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col gap-6 justify-start border-r border-gray-100">
            
            {/* Titel */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800">
                Titel
              </label>
              <input
                type="text"
                placeholder="Type here"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (titleError) setTitleError(false)
                }}
                className={`w-full h-12 bg-white border rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-colors ${
                  titleError
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-gray-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]'
                }`}
              />
              {titleError ? (
                <span className="text-[11px] text-red-500 font-medium">
                  Bitte gib einen Titel ein
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">
                  Assistive Text
                </span>
              )}
            </div>

            {/* Universität */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800">
                Universität
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="z.B. Universität Hamburg"
                className="w-full h-12 bg-white border border-[#7C3AED] rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] transition-colors"
              />
              <span className="text-[11px] text-gray-400">
                Assistive Text
              </span>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={`w-full h-12 bg-white border rounded-xl px-4 ${dateError ? 'pr-10' : 'pr-4'} text-sm text-gray-800 focus:outline-none transition-colors ${
                    dateError 
                      ? 'border-red-500 ring-1 ring-red-500' 
                      : 'border-gray-300 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]'
                  }`}
                />
                {dateError && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                    <AlertCircle className="w-5 h-5 fill-red-500 text-white" />
                  </div>
                )}
              </div>
              {dateError ? (
                <span className="text-[11px] text-red-500 font-medium">
                  {typeof dateError === 'string' ? dateError : 'Error'}
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">
                  Assistive Text
                </span>
              )}
            </div>

            {/* Uhrzeit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800">
                Uhrzeit
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-12 bg-white border border-[#7C3AED] rounded-xl px-4 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] transition-colors"
              />
            </div>

          </div>

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN: Ort, Addresse, Chillen Dropdown & Erstellen Button   */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 p-6 sm:p-10 flex flex-col justify-between">
            
            <div className="flex flex-col gap-6">
              
              {/* Ort */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-800">
                  Ort
                </label>
                <div className="relative">
                  <select
                    value={ort}
                    onChange={(e) => setOrt(e.target.value)}
                    className="w-full h-12 bg-white border border-gray-300 rounded-xl px-4 pr-10 text-sm text-gray-800 appearance-none focus:outline-none focus:border-[#7C3AED] transition-colors"
                  >
                    <option value="Hamburg">Hamburg</option>
                    <option value="Berlin">Berlin</option>
                    <option value="München">München</option>
                    <option value="Köln">Köln</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C3AED]" />
                </div>
              </div>

              {/* Addresse */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-800">
                  Addresse
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="z.B. Stadtpark Hamburg"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-12 bg-white border border-[#7C3AED] rounded-xl px-4 pr-10 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] transition-colors"
                  />
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C3AED]" />
                </div>
              </div>

              {/* Chillen / Sportart Select Dropdown */}
              <div className="flex flex-col gap-1.5">
                <div className="border border-[#7C3AED] rounded-xl overflow-hidden bg-white shadow-xs">
                  {/* Dropdown Header */}
                  <button
                    type="button"
                    onClick={() => setIsSportDropdownOpen(!isSportDropdownOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-800 bg-white"
                  >
                    <span>Chillen</span>
                    <ChevronDown className={`w-4 h-4 text-[#7C3AED] transition-transform ${isSportDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Options */}
                  {isSportDropdownOpen && (
                    <div className="border-t border-gray-100 flex flex-col">
                      <button
                        type="button"
                        onClick={() => setSport('Fussball')}
                        className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                          sport === 'Fussball'
                            ? 'bg-[#F6A94D] text-white font-semibold'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-b border-gray-100'
                        }`}
                      >
                        Fussball
                      </button>

                      <button
                        type="button"
                        onClick={() => setSport('Basketball')}
                        className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors border-b border-gray-100 ${
                          sport === 'Basketball'
                            ? 'bg-[#F6A94D] text-white font-semibold'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Basketball
                      </button>

                      <button
                        type="button"
                        onClick={() => setSport('Vollyball')}
                        className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                          sport === 'Vollyball'
                            ? 'bg-[#F6A94D] text-white font-semibold'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Vollyball
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Blue Submit Button: "Erstellen" */}
            <div className="pt-8">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto min-w-[140px] px-8 py-3 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Wird erstellt...' : 'Erstellen'}
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  )
}
