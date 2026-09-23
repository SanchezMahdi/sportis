import { useState, useEffect, useRef } from 'react'
import { Check, ChevronDown, Camera, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profil() {
  const { user, updateProfile } = useAuth()
  const avatarInputRef = useRef(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    contactNumber: '',
    city: '',
    state: '',
    password: '',
  })

  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Populate from authenticated user if available
  useEffect(() => {
    if (user) {
      const parts = (user.user_metadata?.name || user.user_metadata?.full_name || '').split(' ')
      const fName = parts[0] || ''
      const lName = parts.slice(1).join(' ') || ''

      setForm((prev) => ({
        ...prev,
        firstName: fName,
        lastName: lName,
        email: user.email || prev.email,
        city: user.user_metadata?.city || prev.city,
      }))

      if (user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url)
      }
    }
  }, [user])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte lade eine Bilddatei hoch.')
      return
    }

    setUploadingAvatar(true)
    try {
      if (user) {
        const fileExt = file.name.split('.').pop().toLowerCase()
        const fileName = `avatar-${user.id}.${fileExt}`
        await supabase.storage.from('avatars').remove([fileName])
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
          const newUrl = `${publicUrl}?t=${Date.now()}`
          setAvatarUrl(newUrl)
          await updateProfile({ avatar_url: newUrl })
          toast.success('Profilbild aktualisiert!')
          return
        }
      }
      // Local preview fallback
      const reader = new FileReader()
      reader.onload = () => {
        setAvatarUrl(reader.result)
        toast.success('Profilbild aktualisiert!')
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error(err)
      toast.error('Bild-Upload fehlgeschlagen.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (user) {
        const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
        await updateProfile({
          name: fullName,
          full_name: fullName,
          city: form.city,
        })
      }
      toast.success('Profil erfolgreich gespeichert! 🎉')
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
      toast.error('Profil konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      const parts = (user.user_metadata?.name || '').split(' ')
      setForm({
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        email: user.email || '',
        address: '',
        contactNumber: '',
        city: user.user_metadata?.city || '',
        state: '',
        password: '',
      })
    } else {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        contactNumber: '',
        city: '',
        state: '',
        password: '',
      })
    }
    toast('Änderungen zurückgesetzt')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8 font-['Inter',sans-serif] flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full relative">
        
        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8 sm:p-14 relative z-10">
          
          {/* Top Header: Title "Profile" and Avatar */}
          <div className="flex items-center justify-between pb-8 mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
              Profile
            </h1>

            {/* Circular Avatar */}
            <div 
              onClick={() => avatarInputRef.current?.click()}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden cursor-pointer group shadow-xs ring-2 ring-gray-200/80 bg-gray-100 hover:ring-[#2563EB] transition-all flex items-center justify-center"
              title={avatarUrl ? "Profilbild ändern" : "Profilbild hinzufügen"}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 transition-colors">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
              <input 
                ref={avatarInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload} 
              />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            
            {/* First Name & Last Name (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-900">
                  First Name
                </label>
                <input 
                  type="text"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full h-12 bg-white border border-gray-300 rounded-lg px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-900">
                  Last Name
                </label>
                <input 
                  type="text"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full h-12 bg-white border border-gray-300 rounded-lg px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                />
              </div>
            </div>

            {/* Email (with green checkmark) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-900">
                Email
              </label>
              <div className="relative">
                <input 
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full h-12 bg-white border border-gray-300 rounded-lg pl-4 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-[#22C55E] flex items-center justify-center text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-900">
                Address
              </label>
              <input 
                type="text"
                placeholder="Street address"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full h-12 bg-white border border-gray-300 rounded-lg px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
              />
            </div>

            {/* Contact Number */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-900">
                Contact Number
              </label>
              <input 
                type="text"
                placeholder="Phone number"
                value={form.contactNumber}
                onChange={(e) => handleChange('contactNumber', e.target.value)}
                className="w-full h-12 bg-white border border-gray-300 rounded-lg px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
              />
            </div>

            {/* City & State (2 columns with dropdown) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-900">
                  City
                </label>
                <div className="relative">
                  <select 
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full h-12 bg-white border border-gray-300 rounded-lg px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none transition-colors"
                  >
                    <option value="">Select city</option>
                    <option value="Berlin">Berlin</option>
                    <option value="Hamburg">Hamburg</option>
                    <option value="München">München</option>
                    <option value="Köln">Köln</option>
                    <option value="Frankfurt">Frankfurt</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-900">
                  State
                </label>
                <div className="relative">
                  <select 
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full h-12 bg-white border border-gray-300 rounded-lg px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] appearance-none transition-colors"
                  >
                    <option value="">Select state</option>
                    <option value="Hamburg">Hamburg</option>
                    <option value="Berlin">Berlin</option>
                    <option value="Bayern">Bayern</option>
                    <option value="Hessen">Hessen</option>
                    <option value="Nordrhein-Westfalen">Nordrhein-Westfalen</option>
                    <option value="Baden-Württemberg">Baden-Württemberg</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                </div>
              </div>
            </div>

            {/* Password (with green checkmark) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-900">
                Password
              </label>
              <div className="relative">
                <input 
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full h-12 bg-white border border-gray-300 rounded-lg pl-4 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-[#22C55E] flex items-center justify-center text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>

            {/* Action Buttons: Cancel & Save */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="min-w-[130px] h-11 px-6 rounded-lg border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 font-medium text-sm transition-colors text-center"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="min-w-[130px] h-11 px-8 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-medium text-sm transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Save'
                )}
              </button>
            </div>

          </form>

        </div>

        {/* ────────────────────────────────────────────────────────────────────── */}
        {/* FIGMA MASCOTS FLANKING THE PROFILE CARD                                */}
        {/* ────────────────────────────────────────────────────────────────────── */}
        
        {/* Left Mascot: gee_me_006.png (Soccer avatar with foot on ball) */}
        <div className="hidden xl:block absolute -left-36 bottom-0 z-20 pointer-events-none select-none">
          <img 
            src="/figma/gee_me_006.png" 
            alt="Sportis Soccer Mascot gee_me_006" 
            className="w-44 h-auto object-contain drop-shadow-md" 
          />
        </div>

        {/* Right Mascot: gee_me_036.svg (Basketball player avatar with ball) */}
        <div className="hidden xl:block absolute -right-36 bottom-0 z-20 pointer-events-none select-none">
          <img 
            src="/figma/gee_me_036.svg" 
            alt="Sportis Basketball Mascot gee_me_036" 
            className="w-44 h-auto object-contain drop-shadow-md" 
          />
        </div>

        {/* Mobile / Tablet Mascots Footer strip */}
        <div className="xl:hidden flex items-center justify-around pt-6 select-none pointer-events-none">
          <img 
            src="/figma/gee_me_006.png" 
            alt="Soccer Mascot" 
            className="w-28 h-auto object-contain" 
          />
          <img 
            src="/figma/gee_me_036.svg" 
            alt="Basketball Mascot" 
            className="w-28 h-auto object-contain" 
          />
        </div>

      </div>
    </div>
  )
}
