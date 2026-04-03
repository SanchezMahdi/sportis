import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Users,
  MessageCircle,
  Send,
  Share2,
  ArrowLeft,
  Backpack,
  Clock,
  Check,
  Trash2,
  Pencil,
  X,
  UserX,
  Flag,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORT_EMOJIS, SKILL_COLORS, SPORTARTEN, SKILL_LEVELS, GENDER_FILTERS } from '../lib/constants'
import LoadingSpinner from '../components/LoadingSpinner'

function Avatar({ name, avatarUrl, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  }
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0`}
    >
      {initials}
    </div>
  )
}

function ChatMessage({ message, isOwn }) {
  let time = ''
  try {
    time = format(new Date(message.created_at), 'HH:mm', { locale: de })
  } catch {}

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar name={message.user?.name} size="sm" />
      <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="text-muted text-xs">{message.user?.name}</span>
          <span className="text-muted/60 text-xs">{time}</span>
        </div>
        <div
          className={`px-3 py-2 rounded-2xl text-sm ${
            isOwn
              ? 'bg-primary text-dark font-medium rounded-tr-sm'
              : 'bg-card border border-white/10 text-white rounded-tl-sm'
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  )
}

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [session, setSession] = useState(null)
  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)

  const chatEndRef = useRef(null)
  const chatInputRef = useRef(null)

  const fetchSession = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          creator:users!creator_id(id, name, city, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setSession(data)
    } catch (err) {
      console.error('Session konnte nicht geladen werden:', err)
      toast.error('Session nicht gefunden.')
      navigate('/entdecken')
    }
  }, [id, navigate])

  const fetchParticipants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('*, user:users(id, name, city, avatar_url)')
        .eq('session_id', id)
        .order('joined_at', { ascending: true })

      if (error) throw error
      setParticipants(data || [])
    } catch (err) {
      console.error('Teilnehmer konnten nicht geladen werden:', err)
    }
  }, [id])

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, user:users(id, name, avatar_url)')
        .eq('session_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      console.error('Nachrichten konnten nicht geladen werden:', err)
    }
  }, [id])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchSession(), fetchParticipants(), fetchMessages()])
      setLoading(false)
    }
    init()
  }, [fetchSession, fetchParticipants, fetchMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime: participants
  useEffect(() => {
    const channel = supabase
      .channel(`session-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${id}`,
        },
        () => fetchParticipants()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, user:users(id, name, avatar_url)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages((prev) => {
              // Optimistic-Nachricht entfernen und echte hinzufügen (kein Duplikat)
              const withoutOptimistic = prev.filter((m) => !String(m.id).startsWith('optimistic-'))
              if (withoutOptimistic.some((m) => m.id === data.id)) return withoutOptimistic
              return [...withoutOptimistic, data]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, fetchParticipants])

  const isParticipant = participants.some((p) => p.user_id === user?.id)
  const isFull = participants.length >= (session?.max_players || 0)
  const isCreator = session?.creator_id === user?.id

  const handleJoin = async () => {
    if (!user) {
      toast.error('Bitte melde dich an, um dieser Session beizutreten.')
      navigate('/login')
      return
    }

    setJoining(true)
    try {
      if (isParticipant) {
        // Leave
        const { error } = await supabase
          .from('session_participants')
          .delete()
          .eq('session_id', id)
          .eq('user_id', user.id)

        if (error) throw error
        toast.success('Du hast die Session verlassen.')
      } else {
        if (isFull) {
          toast.error('Diese Session ist leider voll.')
          return
        }
        // Join
        const { error } = await supabase.from('session_participants').insert({
          session_id: id,
          user_id: user.id,
        })

        if (error) throw error
        toast.success('Du bist der Session beigetreten! Viel Spaß! 🎉')
      }
      await fetchParticipants()
    } catch (err) {
      console.error('Fehler:', err)
      toast.error('Aktion fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setJoining(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    setSending(true)
    const text = newMessage.trim()
    setNewMessage('')

    // Optimistic update – sofort anzeigen ohne auf Realtime zu warten
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      session_id: id,
      user_id: user.id,
      text,
      created_at: new Date().toISOString(),
      user: { id: user.id, name: user.user_metadata?.name || user.email, avatar_url: null },
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const { error } = await supabase.from('messages').insert({
        session_id: id,
        user_id: user.id,
        text,
      })
      if (error) throw error
      // Realtime ersetzt die optimistic-Nachricht – kein fetchMessages nötig
    } catch (err) {
      console.error('Nachricht konnte nicht gesendet werden:', err)
      toast.error('Nachricht konnte nicht gesendet werden.')
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setNewMessage(text)
    } finally {
      setSending(false)
      chatInputRef.current?.focus()
    }
  }

  const handleRemoveParticipant = async (userId) => {
    if (!window.confirm('Teilnehmer:in wirklich entfernen?')) return
    try {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', id)
        .eq('user_id', userId)
      if (error) throw error
      toast.success('Teilnehmer:in wurde entfernt.')
      await fetchParticipants()
    } catch (err) {
      console.error(err)
      toast.error('Fehler beim Entfernen.')
    }
  }

  const handleReport = async () => {
    if (!reportReason) { toast.error('Bitte wähle einen Grund aus.'); return }
    setReporting(true)
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: reportTarget.id,
        session_id: id,
        reason: reportReason,
      })
      if (error) throw error
      toast.success('Meldung wurde eingereicht. Danke!')
      setReportTarget(null)
      setReportReason('')
    } catch (err) {
      console.error(err)
      toast.error('Meldung konnte nicht gesendet werden.')
    } finally {
      setReporting(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      toast.success('Link kopiert!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleEditOpen = () => {
    setEditForm({
      title: session.title,
      sport: session.sport,
      date: session.date,
      time: session.time?.slice(0, 5) || '',
      location: session.location,
      address: session.address || '',
      max_players: session.max_players,
      gender_filter: session.gender_filter,
      skill_level: session.skill_level,
      description: session.description || '',
      equipment: session.equipment,
    })
    setIsEditing(true)
  }

  const handleUpdateSession = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          title: editForm.title.trim(),
          sport: editForm.sport,
          date: editForm.date,
          time: editForm.time,
          location: editForm.location.trim(),
          address: editForm.address.trim() || null,
          max_players: parseInt(editForm.max_players),
          gender_filter: editForm.gender_filter,
          skill_level: editForm.skill_level,
          description: editForm.description.trim() || null,
          equipment: editForm.equipment,
        })
        .eq('id', id)
        .eq('creator_id', user.id)

      if (error) throw error
      toast.success('Session erfolgreich aktualisiert!')
      setIsEditing(false)
      await fetchSession()
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
      toast.error('Session konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSession = async () => {
    if (!window.confirm('Session wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
        .eq('creator_id', user.id)

      if (error) throw error
      toast.success('Session erfolgreich gelöscht.')
      navigate('/entdecken')
    } catch (err) {
      console.error('Fehler beim Löschen:', err)
      toast.error('Session konnte nicht gelöscht werden.')
    }
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (!session) return null

  const inputClass = 'w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors'

  const emoji = SPORT_EMOJIS[session.sport] || '🏃'
  const skillColorClass = SKILL_COLORS[session.skill_level] || 'bg-gray-500'

  let formattedDate = ''
  try {
    formattedDate = format(parseISO(session.date), "EEEE, d. MMMM yyyy", { locale: de })
  } catch {
    formattedDate = session.date
  }
  const formattedTime = session.time?.slice(0, 5) || ''

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Report Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">Person melden</h2>
              <button onClick={() => setReportTarget(null)} className="text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted text-sm mb-4">
              Du meldest: <span className="text-white font-medium">{reportTarget.name}</span>
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {['Beleidigung / Harassment', 'No-Show (nicht erschienen)', 'Unangemessenes Verhalten', 'Fake-Profil', 'Sonstiges'].map((reason) => (
                <label key={reason} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${reportReason === reason ? 'border-primary bg-primary/10 text-white' : 'border-white/10 text-muted hover:border-white/30'}`}>
                  <input type="radio" name="reason" value={reason} checked={reportReason === reason} onChange={() => setReportReason(reason)} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${reportReason === reason ? 'border-primary' : 'border-white/30'}`}>
                    {reportReason === reason && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleReport} disabled={reporting || !reportReason}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                {reporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Flag className="w-4 h-4" />}
                Melden
              </button>
              <button onClick={() => { setReportTarget(null); setReportReason('') }}
                className="px-6 py-3 border border-white/20 text-white font-bold rounded-xl hover:border-white/40 transition-colors">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-white font-bold text-xl">Session bearbeiten</h2>
              <button onClick={() => setIsEditing(false)} className="text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSession} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">Titel <span className="text-primary">*</span></label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} className={inputClass} maxLength={100} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">Sportart <span className="text-primary">*</span></label>
                <select value={editForm.sport} onChange={(e) => setEditForm(p => ({ ...p, sport: e.target.value }))} className={inputClass} required>
                  {SPORTARTEN.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white text-sm font-medium">Datum <span className="text-primary">*</span></label>
                  <input type="date" value={editForm.date} onChange={(e) => setEditForm(p => ({ ...p, date: e.target.value }))} className={`${inputClass} [color-scheme:dark]`} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white text-sm font-medium">Uhrzeit <span className="text-primary">*</span></label>
                  <input type="time" value={editForm.time} onChange={(e) => setEditForm(p => ({ ...p, time: e.target.value }))} className={`${inputClass} [color-scheme:dark]`} required />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">Ort <span className="text-primary">*</span></label>
                <input type="text" value={editForm.location} onChange={(e) => setEditForm(p => ({ ...p, location: e.target.value }))} className={inputClass} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">Genaue Adresse <span className="text-muted font-normal text-xs">(optional)</span></label>
                <input type="text" value={editForm.address} onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))} className={inputClass} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white text-sm font-medium">Max. Spieler <span className="text-primary">*</span></label>
                  <input type="number" min={2} max={100} value={editForm.max_players} onChange={(e) => setEditForm(p => ({ ...p, max_players: e.target.value }))} className={inputClass} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white text-sm font-medium">Geschlecht</label>
                  <select value={editForm.gender_filter} onChange={(e) => setEditForm(p => ({ ...p, gender_filter: e.target.value }))} className={inputClass}>
                    {GENDER_FILTERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white text-sm font-medium">Level</label>
                  <select value={editForm.skill_level} onChange={(e) => setEditForm(p => ({ ...p, skill_level: e.target.value }))} className={inputClass}>
                    {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white text-sm font-medium">Beschreibung</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} maxLength={1000} className={`${inputClass} resize-none`} />
              </div>

              <div className="flex items-center justify-between p-4 bg-dark rounded-xl border border-white/10">
                <p className="text-white text-sm font-medium">Ausrüstung vorhanden?</p>
                <button type="button" onClick={() => setEditForm(p => ({ ...p, equipment: !p.equipment }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.equipment ? 'bg-primary' : 'bg-white/20'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${editForm.equipment ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-dark font-bold py-3 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50">
                  {saving ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Wird gespeichert...' : 'Speichern'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-white/20 text-white font-bold rounded-xl hover:border-white/40 transition-colors">
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Zurück</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Session header card */}
          <div className="bg-card rounded-2xl border border-white/10 p-6">
            {/* Sport + badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-2 bg-primary/20 text-primary font-semibold px-3 py-1.5 rounded-full text-sm">
                <span className="text-xl">{emoji}</span>
                {session.sport}
              </span>
              <span className={`${skillColorClass} text-white text-xs font-bold px-2.5 py-1 rounded-lg`}>
                {session.skill_level}
              </span>
              <span className="bg-white/10 text-muted text-xs font-medium px-2.5 py-1 rounded-lg">
                {session.gender_filter}
              </span>
              {session.equipment && (
                <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 text-xs font-medium px-2.5 py-1 rounded-lg">
                  <Backpack className="w-3 h-3" />
                  Ausrüstung vorhanden
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-6 leading-tight">
              {session.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-muted">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <span className="text-white font-medium capitalize">{formattedDate}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-muted">
                <Clock className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <span className="text-white font-medium">{formattedTime} Uhr</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-muted">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <span className="text-white font-medium">{session.location}</span>
                  {session.address && (
                    <p className="text-muted text-sm mt-0.5">{session.address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-muted">
                <Users className="w-5 h-5 text-primary shrink-0" />
                <div className="flex items-center gap-3 flex-1">
                  <span>
                    <span className={`font-medium ${isFull ? 'text-red-400' : 'text-white'}`}>
                      {participants.length}
                    </span>
                    <span> / {session.max_players} Spieler:innen</span>
                  </span>
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isFull ? 'bg-red-500' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min((participants.length / session.max_players) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {session.description && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-white font-semibold mb-2">Beschreibung</h3>
                <p className="text-muted leading-relaxed whitespace-pre-wrap">
                  {session.description}
                </p>
              </div>
            )}

            {/* Share + delete */}
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-primary" />
                    Link kopiert!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Link teilen
                  </>
                )}
              </button>

              {isCreator && (
                <>
                  <button
                    onClick={handleEditOpen}
                    className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Bearbeiten
                  </button>
                  <button
                    onClick={handleDeleteSession}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Session löschen
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Chat section */}
          <div className="bg-card rounded-2xl border border-white/10 flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h2 className="text-white font-semibold">Session-Chat</h2>
              <span className="text-muted text-sm">({messages.length})</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-[300px] max-h-[400px]">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <MessageCircle className="w-12 h-12 text-primary/30 mb-3" />
                  <p className="text-white font-medium mb-1">Noch keine Nachrichten</p>
                  <p className="text-muted text-sm">
                    Schreib als Erste:r etwas in den Chat!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isOwn={msg.user_id === user?.id}
                  />
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-4 border-t border-white/10">
              {user ? (
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    ref={chatInputRef}
                    type="text"
                    placeholder="Nachricht schreiben..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-primary text-dark p-3 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    aria-label="Senden"
                  >
                    {sending ? (
                      <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted text-sm">
                    <Link to="/login" className="text-primary hover:text-green-400 font-medium">
                      Melde dich an
                    </Link>{' '}
                    um am Chat teilzunehmen.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Action card */}
          <div className="bg-card rounded-2xl border border-white/10 p-5">
            <div className="text-center mb-4">
              <p className="text-muted text-sm mb-1">Freie Plätze</p>
              <p className="text-4xl font-black text-white">
                {Math.max(0, session.max_players - participants.length)}
              </p>
              <p className="text-muted text-xs mt-1">
                von {session.max_players} gesamt
              </p>
            </div>

            {user ? (
              <button
                onClick={handleJoin}
                disabled={joining || (isFull && !isParticipant)}
                className={`w-full font-bold py-3.5 rounded-xl transition-all text-sm ${
                  isParticipant
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                    : isFull
                    ? 'bg-white/10 text-muted cursor-not-allowed'
                    : 'bg-primary text-dark hover:bg-green-400 hover:scale-105'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {joining ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isParticipant ? (
                  'Session verlassen'
                ) : isFull ? (
                  'Session ist voll'
                ) : (
                  'Jetzt beitreten'
                )}
              </button>
            ) : (
              <Link
                to="/login"
                className="block w-full text-center bg-primary text-dark font-bold py-3.5 rounded-xl hover:bg-green-400 transition-colors text-sm"
              >
                Anmelden & beitreten
              </Link>
            )}
          </div>

          {/* Creator card */}
          <div className="bg-card rounded-2xl border border-white/10 p-5">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
              Erstellt von
            </h3>
            <div className="flex items-center gap-3">
              <Avatar
                name={session.creator?.name}
                avatarUrl={session.creator?.avatar_url}
                size="lg"
              />
              <div>
                <p className="text-white font-semibold">{session.creator?.name}</p>
                {session.creator?.city && (
                  <p className="text-muted text-sm flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {session.creator.city}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Participants card */}
          <div className="bg-card rounded-2xl border border-white/10 p-5">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide flex items-center justify-between">
              <span>Teilnehmer:innen</span>
              <span className="text-primary text-sm font-bold normal-case">
                {participants.length}/{session.max_players}
              </span>
            </h3>

            {participants.length === 0 ? (
              <p className="text-muted text-sm text-center py-4">
                Noch keine Teilnehmer:innen. Sei die/der Erste!
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar name={p.user?.name} avatarUrl={p.user?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {p.user?.name}
                        {p.user_id === session.creator_id && (
                          <span className="ml-2 text-primary text-xs">(Ersteller:in)</span>
                        )}
                      </p>
                      {p.user?.city && (
                        <p className="text-muted text-xs">{p.user.city}</p>
                      )}
                    </div>
                    {p.user_id === user?.id ? (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    ) : user && (
                      <div className="flex items-center gap-1 shrink-0">
                        {isCreator && p.user_id !== session.creator_id && (
                          <button
                            onClick={() => handleRemoveParticipant(p.user_id)}
                            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Entfernen"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => { setReportTarget(p.user); setReportReason('') }}
                          className="p-1.5 rounded-lg text-muted hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                          title="Melden"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
