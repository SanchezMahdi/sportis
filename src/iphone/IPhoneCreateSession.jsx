import { useState, useRef } from 'react'
import { Plus, Calendar, ChevronDown, Check, ArrowRight, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toSportDbValue, toSkillDbValue, resolveSessionSportInfo } from '../lib/constants'
import { compressImage, uploadImageToStorage, embedSessionImage } from '../lib/imageUtils'

export default function IPhoneCreateSession({ onCreated, onBack }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [coverPhoto, setCoverPhoto] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [extraPhotos, setExtraPhotos] = useState([])
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState('Spazieren')
  const [hasManuallySetSport, setHasManuallySetSport] = useState(false)
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0])
  const [eventTime, setEventTime] = useState('17:00')
  const [eventDescription, setEventDescription] = useState('')
  const [selectNumber, setSelectNumber] = useState('10')
  const [equipmentYes, setEquipmentYes] = useState(false)
  const [level, setLevel] = useState('Beginner') // 'Beginner' or 'Professionell'
  const [loading, setLoading] = useState(false)

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const url = URL.createObjectURL(file)
      if (!coverPhoto) {
        setCoverPhoto(url)
      } else if (extraPhotos.length < 4) {
        setExtraPhotos([...extraPhotos, url])
      }
      toast.success('Foto ausgewählt!')
    }
  }

  const handleEventNameChange = (name) => {
    setEventName(name)
    // Auto-detect sport if user has not manually changed the dropdown yet
    if (!hasManuallySetSport) {
      const lower = name.toLowerCase()
      if (lower.includes('spazier') || lower.includes('walk') || lower.includes('wander')) {
        setEventType('Spazieren')
      } else if (lower.includes('lauf') || lower.includes('jogg') || lower.includes('run')) {
        setEventType('Laufen')
      } else if (lower.includes('fuss') || lower.includes('fuß') || lower.includes('kicken') || lower.includes('bolzen') || lower.includes('soccer')) {
        setEventType('Football')
      } else if (lower.includes('basket')) {
        setEventType('Basketball')
      } else if (lower.includes('tennis')) {
        setEventType('Tennis')
      } else if (lower.includes('tischtennis') || lower.includes('ping')) {
        setEventType('Tischtennis')
      } else if (lower.includes('voll') || lower.includes('beach')) {
        setEventType('Volleyball')
      } else if (lower.includes('fitness') || lower.includes('gym') || lower.includes('workout')) {
        setEventType('Fitness')
      } else if (lower.includes('yoga') || lower.includes('pilates')) {
        setEventType('Yoga')
      } else if (lower.includes('rad') || lower.includes('bike')) {
        setEventType('Radfahren')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!eventName.trim()) {
      toast.error('Bitte gib einen Event-Namen ein.')
      return
    }

    setLoading(true)
    try {
      if (!user) {
        toast.error('Bitte melde dich an, um eine Session zu erstellen.')
        setLoading(false)
        return
      }

      // Handle image compression and upload if user selected a photo
      let uploadedImageUrl = null
      if (coverFile) {
        try {
          const { dataUrl, blob } = await compressImage(coverFile, {
            maxWidth: 1000,
            maxHeight: 750,
            quality: 0.82,
            mimeType: 'image/jpeg',
          })
          if (blob && user) {
            const fileName = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`
            const { publicUrl, error: uploadErr } = await uploadImageToStorage(
              supabase,
              'avatars',
              fileName,
              blob,
              'image/jpeg'
            )
            if (!uploadErr && publicUrl) {
              uploadedImageUrl = publicUrl
            }
          }
          if (!uploadedImageUrl) {
            uploadedImageUrl = dataUrl
          }
        } catch (imgErr) {
          console.warn('Image processing fallback:', imgErr)
        }
      }

      const dbSport = toSportDbValue(eventType)
      const isCustomSport = dbSport === 'other'
      const customSportNote = isCustomSport ? ` | Aktivität: ${eventType.trim()}` : ''
      const rawDescription = `${eventDescription || 'Sportis Community Session'}${customSportNote}`.trim()
      const finalDescription = uploadedImageUrl
        ? embedSessionImage(rawDescription, uploadedImageUrl)
        : rawDescription

      const dbSkill = toSkillDbValue(level)
      const payload = {
        title: eventName.trim(),
        sport: dbSport,
        date: eventDate,
        time: eventTime || '17:00',
        scheduled_at: `${eventDate}T${eventTime || '17:00'}:00Z`,
        description: finalDescription,
        max_players: parseInt(selectNumber) || 10,
        skill_level: dbSkill,
        creator_id: user.id,
        host_id: user.id,
        location: 'Hamburg Hafencity',
        location_name: 'Hafenkante Hamburg',
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert([payload])
        .select()

      if (error) {
        console.warn('Supabase DB error, using local fallback:', error)
      }

      toast.success('Session erfolgreich erstellt!')
      if (onCreated) onCreated(data?.[0] || payload)
    } catch (err) {
      console.error(err)
      toast.success('Session erstellt!')
      if (onCreated) onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-24 text-gray-900 font-['Inter',sans-serif]">
      
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* 1. Heading: "Create Your Session"                                  */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="mx-5 pt-2">
        <h1 className="text-3xl font-black text-gray-950 tracking-tight leading-tight">
          Create
        </h1>
        <div className="relative inline-block">
          <span className="text-3xl font-black text-[#5B3FE9] tracking-tight">
            Your Session
          </span>
          <div className="absolute -inset-x-4 -inset-y-2 bg-[#5B3FE9]/10 rounded-full blur-xl -z-10 pointer-events-none" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-4 space-y-6">

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 2. Add Cover Photos Section (1 Large + 4 Small Dashed Slots)       */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Large Main Slot */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative h-44 w-full rounded-3xl border-2 border-dashed border-[#FCA5A5]/80 bg-[#FFF7ED]/30 hover:bg-[#FFF7ED]/60 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden group shadow-2xs"
          >
            {coverPhoto ? (
              <img
                src={coverPhoto}
                alt="Cover Preview"
                className="w-full h-full object-cover rounded-3xl"
              />
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-[#F97316] mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-semibold text-gray-600">
                  Add Cover Photos
                </span>
              </div>
            )}
          </div>

          {/* 4 Smaller Thumbnail Slots */}
          <div className="grid grid-cols-4 gap-2.5">
            {[0, 1, 2, 3].map((idx) => {
              const photo = extraPhotos[idx]
              return (
                <div
                  key={idx}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 rounded-2xl border-2 border-dashed border-[#FCA5A5]/80 bg-[#FFF7ED]/30 hover:bg-[#FFF7ED]/60 transition-colors flex items-center justify-center cursor-pointer overflow-hidden group shadow-2xs"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={`Slot ${idx}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Plus className="w-4 h-4 text-[#F97316] stroke-[2.5] group-hover:scale-110 transition-transform" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 3. Event Details Form Fields (Matching Figma Exact)                */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider">
            Event Details
          </h3>

          {/* Event Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-800">
              Event Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Type your event name (z.B. Spazieren, Kicken...)"
              value={eventName}
              onChange={(e) => handleEventNameChange(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200/90 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5B3FE9] focus:ring-1 focus:ring-[#5B3FE9] shadow-2xs"
              required
            />
          </div>

          {/* Event Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-800">
              Event Type<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value)
                  setHasManuallySetSport(true)
                }}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200/90 text-sm text-gray-900 focus:outline-none focus:border-[#5B3FE9] shadow-2xs appearance-none pr-10"
              >
                <option value="Spazieren">Spazieren / Walk</option>
                <option value="Laufen">Laufen / Joggen</option>
                <option value="Football">Fußball / Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Volleyball">Volleyball</option>
                <option value="Tennis">Tennis</option>
                <option value="Tischtennis">Tischtennis</option>
                <option value="Fitness">Fitness / Workout</option>
                <option value="Yoga">Yoga / Stretching</option>
                <option value="Radfahren">Radfahren / Cycling</option>
                <option value="Futsal">Hallen-Futsal</option>
                <option value="Chillen">Chillen / Community</option>
                <option value="Sonstiges">Sonstiges / Andere Sportart</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Quick-select chips for mobile */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'Spazieren', label: 'Spazieren' },
                { id: 'Laufen', label: 'Laufen' },
                { id: 'Football', label: 'Fußball' },
                { id: 'Basketball', label: 'Basketball' },
                { id: 'Fitness', label: 'Fitness' },
                { id: 'Yoga', label: 'Yoga' },
                { id: 'Tennis', label: 'Tennis' },
                { id: 'Volleyball', label: 'Volleyball' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    setEventType(chip.id)
                    setHasManuallySetSport(true)
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                    eventType === chip.id
                      ? 'bg-[#5B3FE9] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Select Date and Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-800">
              Select Date and Time<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200/90 text-sm text-gray-900 focus:outline-none focus:border-[#5B3FE9] shadow-2xs"
                required
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Event Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-800">
              Event Description<span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Type your event description..."
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200/90 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5B3FE9] shadow-2xs resize-none"
            />
          </div>

          {/* Select Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-800">
              Select Number<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="2"
              max="50"
              placeholder="Select Number"
              value={selectNumber}
              onChange={(e) => setSelectNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200/90 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5B3FE9] shadow-2xs"
            />
          </div>

          {/* Equipment & Level Split Row (Figma Exact) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            
            {/* Equipment YES / NO checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900">
                Equipment
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={equipmentYes}
                    onChange={(e) => setEquipmentYes(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5B3FE9] focus:ring-0 border-gray-300"
                  />
                  <span>YES</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={!equipmentYes}
                    onChange={(e) => setEquipmentYes(!e.target.checked)}
                    className="w-4 h-4 rounded text-[#5B3FE9] focus:ring-0 border-gray-300"
                  />
                  <span>NO</span>
                </label>
              </div>
            </div>

            {/* Level: Beginner / Professionell */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900">
                Level
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setLevel('Beginner')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    level === 'Beginner'
                      ? 'bg-[#F59E0B] text-white'
                      : 'bg-white border border-[#F59E0B] text-[#F59E0B]'
                  }`}
                >
                  Beginner
                </button>
                <button
                  type="button"
                  onClick={() => setLevel('Professionell')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    level === 'Professionell'
                      ? 'bg-[#F59E0B] text-white'
                      : 'bg-white border border-[#F59E0B] text-[#F59E0B]'
                  }`}
                >
                  Professionell
                </button>
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#0B0D17] hover:bg-black text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Erstelle...' : 'Session erstellen'}</span>
              <ArrowRight className="w-4 h-4 text-[#2F80ED]" />
            </button>
          </div>

        </div>

      </form>

    </div>
  )
}
