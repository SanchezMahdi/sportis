import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, Settings, Bell, LogOut, ChevronRight, Edit2, X, ChevronDown, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { compressImage, uploadImageToStorage } from '../lib/imageUtils'

export default function Profil() {
  const { user, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const avatarInputRef = useRef(null)
  const myProfileAvatarInputRef = useRef(null)

  // Tab state: 'profile' (My Profile board) or 'settings' (Profile Setting board)
  const initialTab = searchParams.get('tab') === 'settings' ? 'settings' : 'profile'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [notificationsAllowed, setNotificationsAllowed] = useState(true)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    city: 'Hamburg',
    password: '',
  })

  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Sync tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'settings') {
      setSearchParams({ tab: 'settings' })
    } else {
      setSearchParams({})
    }
  }

  // Populate from authenticated user and DB if available
  useEffect(() => {
    if (!user) return

    const cachedAvatar = localStorage.getItem(`sportis_user_avatar_${user.id}`)
    const metaAvatar = user.user_metadata?.avatar_url
    if (cachedAvatar) {
      setAvatarUrl(cachedAvatar)
    } else if (metaAvatar) {
      setAvatarUrl(metaAvatar)
    }

    const fullName = user.user_metadata?.name || user.user_metadata?.full_name || ''
    const parts = fullName.split(' ')
    const fName = parts[0] || ''
    const lName = parts.slice(1).join(' ') || ''

    setForm((prev) => ({
      ...prev,
      firstName: fName || prev.firstName,
      lastName: lName || prev.lastName,
      email: user.email || prev.email,
      contactNumber: user.user_metadata?.phone || prev.contactNumber,
      city: user.user_metadata?.city || prev.city || 'Hamburg',
    }))

    // Also fetch latest from public.users table
    async function fetchDbProfile() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (!error && data) {
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url)
            localStorage.setItem(`sportis_user_avatar_${user.id}`, data.avatar_url)
          }
          if (data.city) {
            setForm((p) => ({ ...p, city: data.city }))
          }
          if (data.name) {
            const dbParts = data.name.split(' ')
            setForm((p) => ({
              ...p,
              firstName: dbParts[0] || p.firstName,
              lastName: dbParts.slice(1).join(' ') || p.lastName,
            }))
          }
        }
      } catch (err) {
        console.warn('DB Profil konnte nicht geladen werden:', err)
      }
    }

    fetchDbProfile()
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
    const toastId = toast.loading('Profilbild wird aktualisiert...')

    try {
      // 1. Client-side compression (350x350, JPEG, quality 0.85)
      const { dataUrl, blob } = await compressImage(file, {
        maxWidth: 350,
        maxHeight: 350,
        quality: 0.85,
        mimeType: 'image/jpeg',
      })

      let finalAvatarUrl = dataUrl

      // 2. Attempt Supabase Storage upload to 'avatars' bucket
      if (user && blob) {
        const fileExt = 'jpg'
        const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`
        const { publicUrl, error: uploadErr } = await uploadImageToStorage(
          supabase,
          'avatars',
          fileName,
          blob,
          'image/jpeg'
        )
        if (!uploadErr && publicUrl) {
          finalAvatarUrl = `${publicUrl}?t=${Date.now()}`
        }
      }

      // 3. Immediately save in state & local storage
      setAvatarUrl(finalAvatarUrl)
      if (user?.id) {
        localStorage.setItem(`sportis_user_avatar_${user.id}`, finalAvatarUrl)
      }

      // 4. Persist to DB and Auth metadata
      if (user) {
        await updateProfile({ avatar_url: finalAvatarUrl })
      }

      toast.success('Profilbild aktualisiert! 🎉', { id: toastId })
    } catch (err) {
      console.error('Fehler beim Profilbild-Upload:', err)
      toast.error('Bild konnte nicht verarbeitet werden.', { id: toastId })
    } finally {
      setUploadingAvatar(false)
      // Reset input element so selecting the same file again triggers onChange
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      if (myProfileAvatarInputRef.current) myProfileAvatarInputRef.current.value = ''
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
      if (user) {
        await updateProfile({
          name: fullName || user.user_metadata?.name,
          full_name: fullName || user.user_metadata?.full_name,
          city: form.city,
          phone: form.contactNumber,
          avatar_url: avatarUrl,
        })
      }
      toast.success('Profil erfolgreich gespeichert! 🎉')
      handleTabChange('profile')
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
        contactNumber: user.user_metadata?.phone || '',
        city: user.user_metadata?.city || 'Hamburg',
        password: '',
      })
    }
    toast('Änderungen verworfen')
    handleTabChange('profile')
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Erfolgreich abgemeldet.')
      navigate('/login')
    } catch (err) {
      console.error(err)
      toast.error('Fehler beim Abmelden.')
    }
  }

  const toggleNotifications = () => {
    const next = !notificationsAllowed
    setNotificationsAllowed(next)
    toast(next ? 'Benachrichtigungen aktiviert' : 'Benachrichtigungen deaktiviert')
  }

  // Display name & email helpers
  const displayName = form.firstName || form.lastName
    ? `${form.firstName} ${form.lastName}`.trim()
    : user?.user_metadata?.name || 'Your name'
  const displayEmail = form.email || user?.email || 'yourname@gmail.com'
  const displayPhone = form.contactNumber || user?.user_metadata?.phone || 'Add number'
  const displayCity = form.city || user?.user_metadata?.city || 'USA'

  // Default avatar illustration from Figma
  const defaultAvatar = '/figma/avatar_profile_illustration.png'

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white py-10 px-4 sm:px-6 lg:px-8 font-['Inter',sans-serif]">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Header & Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight">
              {activeTab === 'settings' ? 'Profile Setting' : 'My Profile'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === 'settings'
                ? 'Passe deine persönlichen Angaben und Einstellungen an'
                : 'Verwalte dein Konto und deine Aktivitäten'}
            </p>
          </div>

          {/* Quick Tab Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/60 shadow-2xs">
            <button
              onClick={() => handleTabChange('profile')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              My Profile
            </button>
            <button
              onClick={() => handleTabChange('settings')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Profile Setting
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* VIEW 1: "MY PROFILE" BOARD (Figma 2-Card Layout)                   */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar Card */}
            <div className="lg:col-span-4 w-full bg-white rounded-3xl border border-gray-100 shadow-md p-6">
              {/* User preview header */}
              <div className="flex items-center gap-3.5 pb-6 border-b border-gray-100">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <img
                    src={avatarUrl || defaultAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-950 truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="flex flex-col gap-1.5 mt-5">
                {/* 1. My Profile */}
                <button
                  onClick={() => handleTabChange('profile')}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm bg-gray-100/80 text-gray-950 font-semibold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-700" />
                    <span>My Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                {/* 2. Settings */}
                <button
                  onClick={() => handleTabChange('settings')}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-gray-700" />
                    <span>Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                {/* 3. Notification */}
                <div className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-gray-700" />
                    <span>Notification</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleNotifications}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                      notificationsAllowed
                        ? 'bg-blue-50 text-[#2F80ED] border border-blue-200'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {notificationsAllowed ? 'Allow' : 'Off'}
                  </button>
                </div>

                {/* 4. Log Out */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50/50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Right Overview Card */}
            <div className="lg:col-span-8 w-full bg-white rounded-3xl border border-gray-100 shadow-md p-6 sm:p-10">
              {/* Header row */}
              <div className="flex items-center justify-between pb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      onClick={() => myProfileAvatarInputRef.current?.click()}
                      className="w-14 h-14 rounded-full overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center cursor-pointer group shadow-2xs relative"
                      title="Profilbild ändern"
                    >
                      <img
                        src={avatarUrl || defaultAvatar}
                        alt={displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        {uploadingAvatar ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                    {/* Pencil edit badge */}
                    <button
                      type="button"
                      onClick={() => myProfileAvatarInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-gray-700 hover:text-[#2F80ED] transition-colors"
                      title="Profilbild ändern"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <input
                      ref={myProfileAvatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>

                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-950">{displayName}</h2>
                    <p className="text-xs sm:text-sm text-gray-400">{displayEmail}</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/sessions')}
                  className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-xl hover:bg-gray-50"
                  title="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="border-t border-gray-100" />

              {/* Details list matching Figma exact */}
              <div className="divide-y divide-gray-100">
                {/* Name */}
                <div className="flex items-center justify-between py-4 sm:py-5">
                  <span className="text-sm font-semibold text-gray-900">Name</span>
                  <span className="text-sm text-gray-500 font-normal">{displayName}</span>
                </div>

                {/* Email account */}
                <div className="flex items-center justify-between py-4 sm:py-5">
                  <span className="text-sm font-semibold text-gray-900">Email account</span>
                  <span className="text-sm text-gray-500 font-normal">{displayEmail}</span>
                </div>

                {/* Mobile number */}
                <div className="flex items-center justify-between py-4 sm:py-5">
                  <span className="text-sm font-semibold text-gray-900">Mobile number</span>
                  <button
                    onClick={() => handleTabChange('settings')}
                    className={`text-sm ${
                      displayPhone === 'Add number'
                        ? 'text-[#2F80ED] hover:underline font-medium'
                        : 'text-gray-500'
                    }`}
                  >
                    {displayPhone}
                  </button>
                </div>

                {/* Location */}
                <div className="flex items-center justify-between py-4 sm:py-5">
                  <span className="text-sm font-semibold text-gray-900">Location</span>
                  <span className="text-sm text-gray-500 font-normal">{displayCity}</span>
                </div>
              </div>

              {/* Quick edit CTA */}
              <div className="pt-6 mt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleTabChange('settings')}
                  className="h-10 px-6 rounded-xl bg-[#2F80ED] hover:bg-[#2563EB] text-white font-medium text-sm transition-colors shadow-xs"
                >
                  Profil bearbeiten
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* VIEW 2: "PROFILE SETTING" BOARD (Figma Centered Form + Mascots)    */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="relative max-w-2xl mx-auto py-4">
            
            {/* Main Form Card */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-12 relative z-10">
              
              {/* Header: Title and Avatar Illustration */}
              <div className="flex items-center justify-between pb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
                  Profile Setting
                </h2>

                {/* Top Right Avatar Illustration */}
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-50 border border-gray-100 cursor-pointer group shadow-2xs flex items-center justify-center"
                  title="Profilbild ändern"
                >
                  <img
                    src={avatarUrl || defaultAvatar}
                    alt="Avatar"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
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

              {/* Form fields */}
              <form onSubmit={handleSave} className="flex flex-col gap-5">
                {/* First Name & Last Name (2 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 block">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="First Name"
                      value={form.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 block">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={form.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 block">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Email-Addresse"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-colors"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 block">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={form.contactNumber}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-colors"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 block">
                    City
                  </label>
                  <div className="relative">
                    <select
                      value={form.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 pr-10 text-sm text-gray-900 focus:outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] appearance-none transition-colors"
                    >
                      <option value="NYC">NYC</option>
                      <option value="Berlin">Berlin</option>
                      <option value="Hamburg">Hamburg</option>
                      <option value="München">München</option>
                      <option value="Köln">Köln</option>
                      <option value="Frankfurt">Frankfurt</option>
                      <option value="Stuttgart">Stuttgart</option>
                      <option value="Leipzig">Leipzig</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 block">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="New password (optional)"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-colors"
                  />
                </div>

                {/* Buttons: Cancel & Save */}
                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="min-w-[110px] h-10 px-6 rounded-lg border border-[#2F80ED] text-[#2F80ED] hover:bg-blue-50 font-medium text-sm transition-colors text-center"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="min-w-[110px] h-10 px-8 rounded-lg bg-[#2F80ED] hover:bg-[#2563EB] text-white font-medium text-sm transition-colors shadow-xs flex items-center justify-center disabled:opacity-50"
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

            {/* Left Mascot: Soccer Mascot gee_me_006.png */}
            <div className="hidden xl:block absolute -left-44 bottom-4 z-0 pointer-events-none select-none">
              <img
                src="/figma/gee_me_006.png"
                alt="Sportis Soccer Mascot"
                className="w-40 h-auto object-contain"
              />
            </div>

            {/* Right Mascot: Basketball Mascot gee_me_036_clean.png */}
            <div className="hidden xl:block absolute -right-44 bottom-4 z-0 pointer-events-none select-none">
              <img
                src="/figma/gee_me_036_clean.png"
                alt="Sportis Basketball Mascot"
                className="w-36 h-auto object-contain"
              />
            </div>

            {/* Mobile / Tablet Mascots Footer strip */}
            <div className="xl:hidden flex items-center justify-around pt-6 select-none pointer-events-none">
              <img
                src="/figma/gee_me_006.png"
                alt="Soccer Mascot"
                className="w-24 h-auto object-contain"
              />
              <img
                src="/figma/gee_me_036_clean.png"
                alt="Basketball Mascot"
                className="w-24 h-auto object-contain"
              />
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
