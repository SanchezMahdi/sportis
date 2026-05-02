import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  User,
  MapPin,
  Edit2,
  Check,
  X,
  Plus,
  Calendar,
  Clock,
  Camera,
  Mail,
  MapPinned,
  ShieldAlert,
  Sparkles,
  CalendarCheck,
} from 'lucide-react'
import { parseISO, isFuture, isPast } from 'date-fns'
import toast from 'react-hot-toast'
import { isMissingSupabaseSchema, isNoSupabaseRow, supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTARTEN, SPORT_EMOJIS } from '../lib/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import SessionCard from '../components/SessionCard'

function Avatar({ name, avatarUrl, size = 'xl' }) {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-xl',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-28 h-28 sm:w-32 sm:h-32 text-4xl sm:text-5xl',
  }
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizes[size]} rounded-3xl object-cover ring-4 ring-primary/20 shadow-2xl shadow-primary/10`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} rounded-3xl bg-primary/15 border border-primary/40 flex items-center justify-center text-primary font-black ring-4 ring-primary/10 shadow-2xl shadow-primary/10`}
    >
      {initials}
    </div>
  )
}

function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
        active
          ? 'bg-primary text-dark shadow-lg shadow-primary/15'
          : 'text-muted hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`min-w-6 h-6 inline-flex items-center justify-center text-xs px-1.5 rounded-full font-black ${
            active ? 'bg-dark/15 text-dark' : 'bg-white/10 text-muted'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function StatTile({ value, label, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-dark/45 px-4 py-4 min-w-[8.5rem]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-3xl font-black text-white leading-none">{value}</p>
          <p className="text-muted text-xs font-semibold mt-2">{label}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-white font-bold text-lg mb-2">{title}</p>
        <p className="text-muted text-sm max-w-sm mx-auto leading-relaxed">{text}</p>
      </div>
      {children}
    </div>
  )
}

export default function Profil() {
  const { user, loading: authLoading, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [databaseSetupMissing, setDatabaseSetupMissing] = useState(false)
  const [sessionWarning, setSessionWarning] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming')

  const [mySessions, setMySessions] = useState([])
  const [joinedSessions, setJoinedSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
    gender: '',
    sports: [],
  })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  const fetchProfile = useCallback(async () => {
    if (!user) return
    setLoadingProfile(true)
    try {
      setDatabaseSetupMissing(false)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setDatabaseSetupMissing(false)
      setProfile(data)
      setEditForm({
        name: data.name || '',
        city: data.city || '',
        gender: data.gender || '',
        sports: data.sports || [],
      })
    } catch (err) {
      if (isMissingSupabaseSchema(err)) {
        setDatabaseSetupMissing(true)
        setProfile(null)
        return
      }

      if (isNoSupabaseRow(err)) {
        try {
          const fallbackName =
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Sportis Nutzer'
          const { data, error } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              name: fallbackName,
              city: null,
              gender: null,
              sports: [],
            })
            .select()
            .single()

          if (error) throw error
          setDatabaseSetupMissing(false)
          setProfile(data)
          setEditForm({
            name: data.name || '',
            city: data.city || '',
            gender: data.gender || '',
            sports: data.sports || [],
          })
          return
        } catch (createErr) {
          if (isMissingSupabaseSchema(createErr)) {
            setDatabaseSetupMissing(true)
            setProfile(null)
            return
          }
          console.error('Profil konnte nicht automatisch erstellt werden:', createErr)
        }
      }

      console.error('Fehler beim Laden des Profils:', err)
      toast.error('Profil konnte nicht geladen werden.')
    } finally {
      setLoadingProfile(false)
    }
  }, [user])

  const fetchSessions = useCallback(async () => {
    if (!user) return
    setLoadingSessions(true)
    setSessionWarning('')
    try {
      // Sessions the user joined
      const { data: participantData, error: participantError } = await supabase
        .from('session_participants')
        .select(`
          session:sessions(
            *,
            session_participants(user_id)
          )
        `)
        .eq('user_id', user.id)

      if (participantError) throw participantError

      const joined = (participantData || [])
        .map((p) => p.session)
        .filter(Boolean)
        .map((s) => ({
          ...s,
          participant_count: s.session_participants?.length ?? 0,
        }))

      setJoinedSessions(joined)

      // Sessions the user created (via participants to avoid creator_id ambiguity)
      const { data: createdData, error: createdError } = await supabase
        .from('sessions')
        .select(`
          *,
          session_participants(user_id)
        `)
        .eq('creator_id', user.id)
        .order('date', { ascending: true })

      if (createdError) throw createdError

      setMySessions(
        (createdData || []).map((s) => ({
          ...s,
          participant_count: s.session_participants?.length ?? 0,
        }))
      )
    } catch (err) {
      setJoinedSessions([])
      setMySessions([])
      if (isMissingSupabaseSchema(err)) {
        setSessionWarning('Session-Daten sind noch nicht eingerichtet. Dein Profil bleibt trotzdem nutzbar.')
        console.warn('Session-Tabellen oder Relationen fehlen:', err)
        return
      }
      setSessionWarning('Sessions konnten gerade nicht geladen werden.')
      console.warn('Fehler beim Laden der Sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchSessions()
    }
  }, [user, fetchProfile, fetchSessions])

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name ist erforderlich.')
      return
    }
    setSaving(true)
    try {
      await updateProfile({
        name: editForm.name.trim(),
        city: editForm.city.trim() || null,
        gender: editForm.gender || null,
        sports: editForm.sports,
      })
      await fetchProfile()
      setEditing(false)
      toast.success('Profil erfolgreich gespeichert!')
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
      toast.error('Profil konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Konto wirklich löschen? Alle deine Daten (Profil, Sessions, Nachrichten) werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.'
    )
    if (!confirmed) return
    const doubleCheck = window.prompt('Tippe "LÖSCHEN" um zu bestätigen:')
    if (doubleCheck !== 'LÖSCHEN') { toast.error('Abgebrochen.'); return }
    try {
      // Delete user data
      await supabase.from('session_participants').delete().eq('user_id', user.id)
      await supabase.from('messages').delete().eq('user_id', user.id)
      await supabase.from('notifications').delete().eq('user_id', user.id)
      await supabase.from('join_requests').delete().eq('user_id', user.id)
      await supabase.from('reviews').delete().eq('from_user_id', user.id)
      await supabase.from('users').delete().eq('id', user.id)
      await supabase.auth.signOut()
      toast.success('Konto gelöscht. Auf Wiedersehen!')
      navigate('/')
    } catch (err) {
      toast.error('Fehler beim Löschen: ' + err.message)
    }
  }

  const handleAvatarRemove = async () => {
    if (!profile?.avatar_url) return
    if (!window.confirm('Profilbild wirklich entfernen?')) return
    setUploadingAvatar(true)
    try {
      // Alle möglichen Dateiendungen versuchen zu löschen
      const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
      await Promise.allSettled(
        extensions.map((ext) =>
          supabase.storage.from('avatars').remove([`avatar-${user.id}.${ext}`])
        )
      )
      await updateProfile({ avatar_url: null })
      await fetchProfile()
      toast.success('Profilbild entfernt.')
    } catch (err) {
      console.error(err)
      toast.error('Profilbild konnte nicht entfernt werden.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Nur Bilder erlaubt (JPG, PNG, etc.)'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Bild darf maximal 5 MB groß sein.'); return }

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop().toLowerCase()
      const fileName = `avatar-${user.id}.${fileExt}`

      // Erst versuchen zu löschen (ignoriere Fehler)
      await supabase.storage.from('avatars').remove([fileName])

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload Fehler:', uploadError)
        toast.error(`Upload fehlgeschlagen: ${uploadError.message}`)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

      await updateProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` })
      await fetchProfile()
      toast.success('Profilbild gespeichert!')
    } catch (err) {
      console.error('Avatar Fehler:', err)
      toast.error(`Fehler: ${err.message}`)
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const toggleEditSport = (sport) => {
    setEditForm((prev) => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter((s) => s !== sport)
        : [...prev.sports, sport],
    }))
  }

  // Filter joined sessions into upcoming and past
  const upcomingSessions = joinedSessions.filter((s) => {
    try {
      return isFuture(parseISO(s.date))
    } catch {
      return true
    }
  })

  const pastSessions = joinedSessions.filter((s) => {
    try {
      return isPast(parseISO(s.date))
    } catch {
      return false
    }
  })

  const completionItems = [
    Boolean(profile?.name),
    Boolean(profile?.city),
    Boolean(profile?.sports?.length),
    Boolean(profile?.avatar_url),
  ]
  const profileCompletion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100
  )

  if (authLoading || loadingProfile) return <LoadingSpinner fullScreen />

  if (databaseSetupMissing) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card rounded-2xl border border-yellow-500/30 p-6 sm:p-8">
          <h1 className="text-white text-2xl font-black mb-3">Supabase-Datenbank fehlt</h1>
          <p className="text-muted text-sm leading-relaxed">
            Dein Login funktioniert, aber die Profil-Tabelle im aktuell verbundenen Supabase-Projekt ist nicht erreichbar.
            Prüfe, ob die App mit dem richtigen Supabase-Projekt verbunden ist und ob
            <code className="mx-1 text-primary">public.users</code> angelegt wurde.
          </p>
          <p className="text-muted text-sm leading-relaxed mt-3">
            Öffne in Supabase den SQL Editor und führe zuerst
            <code className="mx-1 text-primary">supabase-schema.sql</code> aus. Danach die Migrationen
            <code className="mx-1 text-primary">001_score_tracking.sql</code> und
            <code className="mx-1 text-primary">002_court_bookings.sql</code>.
          </p>
          <Link
            to="/entdecken"
            className="inline-flex mt-6 bg-primary text-dark font-bold text-sm px-5 py-3 rounded-xl hover:bg-green-400 transition-colors"
          >
            Zurück zur App
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <p className="text-primary text-sm font-black uppercase tracking-[0.18em]">Konto</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-2">Dein Profil</h1>
        <p className="text-muted text-sm mt-2">Verwalte deine Sportarten, Sessions und Kontodaten an einem Ort.</p>
      </div>

      {/* Profile header */}
      <div className="relative overflow-hidden bg-card rounded-3xl border border-white/10 p-5 sm:p-7 mb-6 shadow-2xl shadow-black/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
        {editing ? (
          /* Edit mode */
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-white font-black text-2xl">Profil bearbeiten</h2>
                <p className="text-muted text-sm mt-1">Halte deine Angaben aktuell, damit passende Sessions leichter gefunden werden.</p>
              </div>
              <div className="flex flex-col xs:flex-row gap-2 sm:flex-row">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-primary text-dark font-bold px-5 py-3 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 text-sm"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setEditForm({
                      name: profile?.name || '',
                      city: profile?.city || '',
                      gender: profile?.gender || '',
                      sports: profile?.sports || [],
                    })
                  }}
                  className="flex items-center justify-center gap-2 bg-dark/60 border border-white/10 text-muted hover:text-white px-5 py-3 rounded-xl transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  Abbrechen
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-dark/35 border border-white/10 p-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">
                  Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-dark/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                  maxLength={100}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">Stadt</label>
                <input
                  type="text"
                  placeholder="z.B. Berlin"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="bg-dark/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                  maxLength={100}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-white text-sm font-medium">Geschlecht</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="bg-dark/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                >
                  <option value="">Keine Angabe</option>
                  <option value="Weiblich">Weiblich</option>
                  <option value="Männlich">Männlich</option>
                  <option value="Divers">Divers</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-dark/35 border border-white/10 p-4">
              <label className="text-white text-sm font-medium">Meine Sportarten</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {SPORTARTEN.map((sport) => {
                  const selected = editForm.sports.includes(sport)
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleEditSport(sport)}
                      className={`px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
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
            </div>
          </div>
        ) : (
          /* View mode */
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 lg:gap-8 items-center">
            <div className="relative shrink-0 flex flex-col items-center gap-3">
              <div
                className="relative group cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
                title="Profilbild ändern"
              >
                <Avatar name={profile?.name} avatarUrl={profile?.avatar_url} />
                <div className="absolute inset-0 rounded-3xl bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar
                    ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera className="w-6 h-6 text-white" />
                  }
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              {profile?.avatar_url && (
                <button
                  onClick={handleAvatarRemove}
                  disabled={uploadingAvatar}
                  className="text-xs text-red-300 hover:text-red-200 transition-colors disabled:opacity-50"
                >
                  Bild entfernen
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
                <div>
                  <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                    {profile?.name}
                  </h2>
                  <div className="flex items-center gap-2 text-muted text-sm mt-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>{profile?.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors sm:ml-auto"
                >
                  <Edit2 className="w-4 h-4" />
                  Bearbeiten
                </button>
              </div>

              {/* Info badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                {profile?.city && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-dark/50 border border-white/10 px-3 py-1.5 text-muted text-sm">
                    <MapPinned className="w-4 h-4 text-primary" />
                    {profile.city}
                  </div>
                )}
                {profile?.gender && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-dark/50 border border-white/10 px-3 py-1.5 text-muted text-sm">
                    <User className="w-4 h-4 text-primary" />
                    {profile.gender}
                  </div>
                )}
              </div>

              {/* Sports */}
              {profile?.sports && profile.sports.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.sports.map((sport) => (
                    <span
                      key={sport}
                      className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary text-xs font-bold px-3 py-2 rounded-full"
                    >
                      <span>{SPORT_EMOJIS[sport]}</span>
                      {sport}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3">
                  <p className="text-muted text-sm">
                    Keine Sportarten angegeben.{' '}
                  <button
                    onClick={() => setEditing(true)}
                    className="text-primary hover:text-green-400 transition-colors font-bold"
                  >
                    Jetzt hinzufügen
                  </button>
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 w-full lg:w-44">
              <StatTile value={joinedSessions.length} label="Beigetreten" icon={CalendarCheck} />
              <StatTile value={mySessions.length} label="Erstellt" icon={Plus} />
              <div className="rounded-2xl border border-white/10 bg-dark/45 px-4 py-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-2xl font-black text-white leading-none">{profileCompletion}%</p>
                    <p className="text-muted text-xs font-semibold mt-2">Profilstärke</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-black/10">
        <div className="p-3 border-b border-white/10 bg-dark/25">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <TabButton
            active={activeTab === 'upcoming'}
            onClick={() => setActiveTab('upcoming')}
            count={upcomingSessions.length}
          >
            Kommende Sessions
          </TabButton>
          <TabButton
            active={activeTab === 'past'}
            onClick={() => setActiveTab('past')}
            count={pastSessions.length}
          >
            Vergangene
          </TabButton>
          <TabButton
            active={activeTab === 'mine'}
            onClick={() => setActiveTab('mine')}
            count={mySessions.length}
          >
            Meine Sessions
          </TabButton>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {sessionWarning && (
            <div className="mb-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
              <p className="text-yellow-100 text-sm">{sessionWarning}</p>
            </div>
          )}

          {loadingSessions ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Upcoming sessions */}
              {activeTab === 'upcoming' && (
                <div>
                  {upcomingSessions.length === 0 ? (
                    <EmptyState
                      icon={Calendar}
                      title="Keine kommenden Sessions"
                      text="Entdecke Sessions in deiner Stadt oder erstelle eine eigene."
                    >
                      <div className="flex gap-3 mt-2">
                        <Link
                          to="/entdecken"
                          className="flex items-center gap-2 border border-white/20 text-white font-medium px-4 py-2.5 rounded-xl hover:border-primary hover:text-primary transition-colors text-sm"
                        >
                          Sessions entdecken
                        </Link>
                        <Link
                          to="/session/erstellen"
                          className="flex items-center gap-2 bg-primary text-dark font-bold px-4 py-2.5 rounded-xl hover:bg-green-400 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Erstellen
                        </Link>
                      </div>
                    </EmptyState>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {upcomingSessions.map((s) => (
                        <SessionCard key={s.id} session={s} currentUserId={user?.id} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Past sessions */}
              {activeTab === 'past' && (
                <div>
                  {pastSessions.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title="Noch keine vergangenen Sessions"
                      text="Hier erscheinen deine gespielten Sessions."
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {pastSessions.map((s) => (
                        <SessionCard key={s.id} session={s} currentUserId={user?.id} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My created sessions */}
              {activeTab === 'mine' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-muted text-sm">
                      Sessions die du erstellt hast
                    </p>
                    <Link
                      to="/session/erstellen"
                      className="flex items-center gap-2 bg-primary text-dark font-bold text-xs px-3 py-2 rounded-lg hover:bg-green-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Neue Session
                    </Link>
                  </div>

                  {mySessions.length === 0 ? (
                    <EmptyState
                      icon={Plus}
                      title="Noch keine Sessions erstellt"
                      text="Erstelle deine erste Session und bring Sportler:innen zusammen."
                    >
                      <Link
                        to="/session/erstellen"
                        className="flex items-center gap-2 bg-primary text-dark font-bold px-5 py-3 rounded-xl hover:bg-green-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Erste Session erstellen
                      </Link>
                    </EmptyState>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mySessions.map((s) => (
                        <SessionCard key={s.id} session={s} currentUserId={user?.id} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* GDPR: Account löschen */}
        <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/5 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-300 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-red-200 font-bold text-sm">Gefahrenzone</h3>
                <p className="text-muted text-xs mt-1 leading-relaxed">
                  Das Löschen deines Kontos entfernt alle deine Daten dauerhaft.
                </p>
              </div>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="shrink-0 px-4 py-2.5 text-sm font-bold text-red-200 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-colors"
            >
              Konto löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
