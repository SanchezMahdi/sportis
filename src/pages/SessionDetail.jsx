import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import FigmaSessionDetail from './FigmaSessionDetail'
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
import {
  SPORT_EMOJIS,
  SKILL_COLORS,
  SPORTARTEN,
  SKILL_LEVELS,
  GENDER_FILTERS,
  toSkillDbValue,
  toSkillLabel,
  toSportDbValue,
  toSportLabel,
} from '../lib/constants'
import DOMPurify from 'dompurify'
import LoadingSpinner from '../components/LoadingSpinner'
import WeatherWidget from '../components/WeatherWidget'
import EquipmentChecklist from '../components/EquipmentChecklist'
import PostGameVoting from '../components/PostGameVoting'

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
        className={`${sizes[size]} rounded-full object-cover ring-1 ring-gray-200`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2F80ED] font-bold shrink-0`}
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
  const senderName = message.user?.name || 'Unbekannter Nutzer'
  const messageText = message.text || message.content || ''

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar name={senderName} avatarUrl={message.user?.avatar_url} size="sm" />
      <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">{senderName}</span>
          <span className="text-gray-400 text-xs">{time}</span>
        </div>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm ${
            isOwn
              ? 'bg-[#2F80ED] text-white font-medium rounded-tr-sm shadow-xs'
              : 'bg-gray-100 border border-gray-200/60 text-gray-900 rounded-tl-sm'
          }`}
        >
          {messageText}
        </div>
      </div>
    </div>
  )
}

function isMissingMessageUserProfileError(error) {
  const serialized = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
  return error?.code === '23503' && serialized.includes('messages_user_id_fkey')
}

function isAuthMessageError(error) {
  const serialized = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase()
  return (
    error?.status === 401 ||
    error?.code === '42501' ||
    serialized.includes('jwt') ||
    serialized.includes('auth')
  )
}

function isMissingContentColumnError(error) {
  const serialized = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase()
  return serialized.includes('content') && (
    error?.code === 'PGRST204' ||
    serialized.includes('could not find') ||
    serialized.includes('column')
  )
}

function getSendMessageErrorText(error) {
  const message = error?.message || ''

  if (message.includes('Bitte melde dich neu an')) {
    return message
  }
  if (error?.code === '42501' || message.includes('row-level security')) {
    return 'Nachricht konnte nicht gesendet werden. Bitte melde dich neu an und tritt der Session erneut bei.'
  }
  if (error?.code === '23503') {
    return 'Nachricht konnte nicht gesendet werden. Dein Profil oder diese Session ist in der Datenbank nicht vollständig verknüpft.'
  }

  return 'Nachricht konnte nicht gesendet werden.'
}

export default function SessionDetail() {
  const { id } = useParams()
  if (id === 'football' || id === 'basketball' || id === 'swimming' || id === 'figma' || id === 'detail') {
    return <FigmaSessionDetail />
  }
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
  const [joinRequest, setJoinRequest] = useState(null)
  const [pendingRequests, setPendingRequests] = useState([])
  const [equipmentItems, setEquipmentItems] = useState([])
  const [plusOne, setPlusOne] = useState(false)

  const chatEndRef = useRef(null)
  const chatInputRef = useRef(null)

  const getFallbackMessageUser = useCallback((userId) => ({
    id: userId,
    name: userId === user?.id ? (user?.user_metadata?.name || user?.email || 'Du') : 'Unbekannter Nutzer',
    avatar_url: null,
  }), [user])

  const attachUsersToMessages = useCallback(async (messageRows = []) => {
    if (!messageRows.length) return []

    const userIds = [...new Set(messageRows.map((message) => message.user_id).filter(Boolean))]
    if (!userIds.length) {
      return messageRows.map((message) => ({
        ...message,
        user: getFallbackMessageUser(message.user_id),
      }))
    }

    const { data: usersData, error } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', userIds)

    if (error) {
      console.error('Nutzer für Nachrichten konnten nicht geladen werden:', error)
      return messageRows.map((message) => ({
        ...message,
        user: getFallbackMessageUser(message.user_id),
      }))
    }

    const usersById = new Map((usersData || []).map((messageUser) => [messageUser.id, messageUser]))
    return messageRows.map((message) => ({
      ...message,
      user: usersById.get(message.user_id) || getFallbackMessageUser(message.user_id),
    }))
  }, [getFallbackMessageUser])

  const fetchSession = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          creator:users!creator_id(id, name, city, avatar_url, reliability_score)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      const effectiveCreatorId = data.creator_id || data.host_id
      let creatorUser = data.creator
      if (!creatorUser && effectiveCreatorId) {
        try {
          const { data: u } = await supabase
            .from('users')
            .select('id, name, city, avatar_url, reliability_score')
            .eq('id', effectiveCreatorId)
            .maybeSingle()
          if (u) creatorUser = u
        } catch {}
      }

      let effectiveDate = data.date
      let effectiveTime = data.time
      if (!effectiveDate && data.scheduled_at) {
        effectiveDate = data.scheduled_at.slice(0, 10)
      }
      if (!effectiveTime && data.scheduled_at) {
        try {
          const d = new Date(data.scheduled_at)
          effectiveTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        } catch {
          effectiveTime = '18:00'
        }
      }

      const effectiveLocation = data.location || data.location_name || 'Hamburg'

      setSession({
        ...data,
        creator_id: effectiveCreatorId,
        creator: creatorUser,
        date: effectiveDate,
        time: effectiveTime,
        location: effectiveLocation,
      })
    } catch (err) {
      console.error('Session konnte nicht geladen werden:', err)
      toast.error('Session nicht gefunden.')
      navigate('/sessions')
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
        .select('id, session_id, user_id, text, content, created_at')
        .eq('session_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(await attachUsersToMessages(data || []))
    } catch (err) {
      console.error('Nachrichten konnten nicht geladen werden:', err)
    }
  }, [id, attachUsersToMessages])

  const fetchJoinRequests = useCallback(async () => {
    setJoinRequest(null)
    setPendingRequests([])
  }, [id, user])

  const fetchEquipment = useCallback(async () => {
    const { data } = await supabase
      .from('equipment_items')
      .select('*, bringer:users!brought_by(id, name)')
      .eq('session_id', id)
      .order('created_at', { ascending: true })
    setEquipmentItems(data || [])
  }, [id])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchSession(), fetchParticipants(), fetchMessages(), fetchJoinRequests(), fetchEquipment()])
      setLoading(false)
    }
    init()
  }, [fetchSession, fetchParticipants, fetchMessages, fetchJoinRequests, fetchEquipment])

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
          event: 'INSERT',
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
          const [data] = await attachUsersToMessages([payload.new])
          if (data) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev
              return [...prev, data]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, fetchParticipants, attachUsersToMessages])

  const isParticipant = participants.some((p) => p.user_id === user?.id)
  const confirmedCount = participants.filter((p) => !p.waitlist).length
  const isFull = confirmedCount >= (session?.max_players || 0)
  const isCreator = Boolean(
    user?.id && (
      session?.creator_id === user.id ||
      session?.host_id === user.id
    )
  )
  const isExpired = session?.date
    ? new Date(`${session.date}T${session.time || '23:59:59'}`) < new Date()
    : false

  const handleSendRequest = async () => {
    if (!user) { navigate('/login'); return }
    setJoining(true)
    try {
      const { error } = await supabase.from('session_participants').insert({
        session_id: id,
        user_id: user.id,
      })
      if (error) throw error
      toast.success('Du bist der Session beigetreten!')
      await fetchParticipants()
    } catch (err) {
      toast.error(err.message || 'Beitritt fehlgeschlagen.')
    } finally {
      setJoining(false)
    }
  }

  const handleCancelRequest = async () => {
    setJoining(true)
    try {
      const { error } = await supabase
        .from('join_requests')
        .delete()
        .eq('session_id', id)
        .eq('user_id', user.id)
      if (error) throw error
      setJoinRequest(null)
      toast.success('Anfrage zurückgezogen.')
    } catch (err) {
      toast.error('Fehler beim Zurückziehen.')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!window.confirm('Session wirklich verlassen?')) return
    setJoining(true)
    try {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', id)
        .eq('user_id', user.id)
      if (error) throw error
      toast.success('Du hast die Session verlassen.')
      await fetchParticipants()
    } catch (err) {
      toast.error(err.message || 'Fehler beim Verlassen.')
    } finally {
      setJoining(false)
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      const { error } = await supabase.rpc('accept_join_request', { p_request_id: requestId })
      if (error) throw error
      toast.success('Anfrage akzeptiert!')
      await Promise.all([fetchParticipants(), fetchJoinRequests()])
    } catch (err) {
      toast.error(err.message || 'Fehler beim Akzeptieren.')
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      const { error } = await supabase.rpc('reject_join_request', { p_request_id: requestId })
      if (error) throw error
      toast.success('Anfrage abgelehnt.')
      await fetchJoinRequests()
    } catch (err) {
      toast.error(err.message || 'Fehler beim Ablehnen.')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return
    if (!isParticipant && !isCreator) return

    setSending(true)
    const text = DOMPurify.sanitize(newMessage.trim(), { ALLOWED_TAGS: [] })

    const insertMessage = async (senderId) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          session_id: id,
          user_id: senderId,
          text,
          content: text,
        })
        .select('id, session_id, user_id, text, content, created_at')
        .single()

      if (error) throw error
      return data
    }

    const ensureOwnMessageProfile = async (currentUser) => {
      const name = currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || currentUser.email || 'Nutzer'
      const { error } = await supabase.from('users').upsert({
        id: currentUser.id,
        email: currentUser.email,
        name,
      }, { onConflict: 'id' })

      if (error) throw error
    }

    try {
      let data
      try {
        data = await insertMessage(user.id)
      } catch (insertError) {
        if (isMissingContentColumnError(insertError)) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('messages')
            .insert({
              session_id: id,
              user_id: user.id,
              text,
            })
            .select('id, session_id, user_id, text, content, created_at')
            .single()

          if (fallbackError) throw fallbackError
          data = fallbackData
        } else if (isMissingMessageUserProfileError(insertError)) {
          await ensureOwnMessageProfile(user)
          data = await insertMessage(user.id)
        } else if (isAuthMessageError(insertError)) {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          if (sessionError || !sessionData?.session?.user) throw insertError
          data = await insertMessage(sessionData.session.user.id)
        } else {
          throw insertError
        }
      }

      const [messageWithUser] = await attachUsersToMessages([data])

      setMessages((prev) => {
        if (!messageWithUser || prev.some((m) => m.id === messageWithUser.id)) return prev
        return [...prev, messageWithUser]
      })
      setNewMessage('')

      // Fire-and-forget: email notification to other participants (non-blocking)
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession()
        if (authSession) {
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authSession.access_token}`,
              },
              body: JSON.stringify({
                message_id: data.id,
              }),
            }
          ).catch(() => {})
        }
      } catch { /* non-critical */ }
    } catch (err) {
      console.error('Nachricht konnte nicht gesendet werden:', err)
      toast.error(getSendMessageErrorText(err))
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
      setParticipants((prev) => prev.filter((p) => p.user_id !== userId))
      toast.success('Teilnehmer:in wurde entfernt.')
    } catch (err) {
      toast.error(err.message || 'Fehler beim Entfernen.')
    }
  }

  const handleReport = async () => {
    if (!user) return
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
      sport: toSportLabel(session.sport),
      date: session.date,
      time: session.time?.slice(0, 5) || '',
      location: session.location,
      address: session.address || '',
      max_players: session.max_players,
      gender_filter: session.gender_filter,
      skill_level: toSkillLabel(session.skill_level),
      description: session.description || '',
      equipment: session.equipment,
    })
    setIsEditing(true)
  }

  const handleUpdateSession = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.rpc('update_session', {
        p_session_id: id,
        p_title: editForm.title.trim(),
        p_sport: toSportDbValue(editForm.sport),
        p_date: editForm.date,
        p_time: editForm.time,
        p_location: editForm.location.trim(),
        p_address: editForm.address.trim() || null,
        p_max_players: parseInt(editForm.max_players),
        p_gender_filter: editForm.gender_filter,
        p_skill_level: toSkillDbValue(editForm.skill_level),
        p_description: editForm.description.trim() || null,
        p_equipment: editForm.equipment,
      })
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
    if (!window.confirm('Session wirklich unwiderruflich löschen?')) return

    try {
      let deleted = false

      // 1. Try RPC delete_session
      try {
        const { error: rpcError } = await supabase.rpc('delete_session', { p_session_id: id })
        if (!rpcError) {
          deleted = true
        } else {
          console.warn('RPC delete_session notice:', rpcError)
        }
      } catch (rpcErr) {
        console.warn('RPC exception:', rpcErr)
      }

      // 2. Direct delete fallback from sessions table
      if (!deleted) {
        try { await supabase.from('messages').delete().eq('session_id', id) } catch {}
        try { await supabase.from('session_participants').delete().eq('session_id', id) } catch {}
        try { await supabase.from('equipment_items').delete().eq('session_id', id) } catch {}
        try { await supabase.from('notifications').delete().eq('session_id', id) } catch {}

        const { error: directError } = await supabase
          .from('sessions')
          .delete()
          .eq('id', id)

        if (directError) throw directError
        deleted = true
      }

      toast.success('Session erfolgreich gelöscht.')
      navigate('/sessions')
    } catch (err) {
      console.error('Fehler beim Löschen:', err)
      toast.error(err?.message || 'Session konnte nicht gelöscht werden.')
    }
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (!session) return null

  const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-colors'

  const sportLabel = toSportLabel(session.sport)
  const skillLabel = toSkillLabel(session.skill_level)
  const emoji = SPORT_EMOJIS[sportLabel] || '🏃'
  const skillColorClass = SKILL_COLORS[skillLabel] || 'bg-gray-500'

  let formattedDate = ''
  try {
    formattedDate = format(parseISO(session.date), "EEEE, d. MMMM yyyy", { locale: de })
  } catch {
    formattedDate = session.date
  }
  const formattedTime = session.time?.slice(0, 5) || ''

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-['Inter',sans-serif]">

      {/* Report Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-950 font-bold text-lg">Person melden</h2>
              <button onClick={() => setReportTarget(null)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Du meldest: <span className="text-gray-950 font-semibold">{reportTarget.name}</span>
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {['Beleidigung / Harassment', 'No-Show (nicht erschienen)', 'Unangemessenes Verhalten', 'Fake-Profil', 'Sonstiges'].map((reason) => (
                <label key={reason} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${reportReason === reason ? 'border-[#2F80ED] bg-blue-50/50 text-[#2F80ED] font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  <input type="radio" name="reason" value={reason} checked={reportReason === reason} onChange={() => setReportReason(reason)} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${reportReason === reason ? 'border-[#2F80ED]' : 'border-gray-300'}`}>
                    {reportReason === reason && <div className="w-2 h-2 rounded-full bg-[#2F80ED]" />}
                  </div>
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleReport} disabled={reporting || !reportReason}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                {reporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Flag className="w-4 h-4" />}
                Melden
              </button>
              <button onClick={() => { setReportTarget(null); setReportReason('') }}
                className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-gray-950 font-bold text-xl">Session bearbeiten</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSession} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700 text-sm font-semibold">Titel <span className="text-red-500">*</span></label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} className={inputClass} maxLength={100} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700 text-sm font-semibold">Sportart <span className="text-red-500">*</span></label>
                <select value={editForm.sport} onChange={(e) => setEditForm(p => ({ ...p, sport: e.target.value }))} className={inputClass} required>
                  {SPORTARTEN.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700 text-sm font-semibold">Datum <span className="text-red-500">*</span></label>
                  <input type="date" value={editForm.date} onChange={(e) => setEditForm(p => ({ ...p, date: e.target.value }))} className={inputClass} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700 text-sm font-semibold">Uhrzeit <span className="text-red-500">*</span></label>
                  <input type="time" value={editForm.time} onChange={(e) => setEditForm(p => ({ ...p, time: e.target.value }))} className={inputClass} required />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700 text-sm font-semibold">Ort <span className="text-red-500">*</span></label>
                <input type="text" value={editForm.location} onChange={(e) => setEditForm(p => ({ ...p, location: e.target.value }))} className={inputClass} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700 text-sm font-semibold">Genaue Adresse <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                <input type="text" value={editForm.address} onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))} className={inputClass} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700 text-sm font-semibold">Max. Spieler <span className="text-red-500">*</span></label>
                  <input type="number" min={2} max={100} value={editForm.max_players} onChange={(e) => setEditForm(p => ({ ...p, max_players: e.target.value }))} className={inputClass} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700 text-sm font-semibold">Geschlecht</label>
                  <select value={editForm.gender_filter} onChange={(e) => setEditForm(p => ({ ...p, gender_filter: e.target.value }))} className={inputClass}>
                    {GENDER_FILTERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700 text-sm font-semibold">Level</label>
                  <select value={editForm.skill_level} onChange={(e) => setEditForm(p => ({ ...p, skill_level: e.target.value }))} className={inputClass}>
                    {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700 text-sm font-semibold">Beschreibung</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} maxLength={1000} className={`${inputClass} resize-none`} />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-gray-800 text-sm font-medium">Ausrüstung vorhanden?</p>
                <button type="button" onClick={() => setEditForm(p => ({ ...p, equipment: !p.equipment }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.equipment ? 'bg-[#2F80ED]' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${editForm.equipment ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#0B0D17] hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 shadow-sm">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Wird gespeichert...' : 'Speichern'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
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
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 group font-medium"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Zurück</span>
      </button>

      {/* Expired banner */}
      {isExpired && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 shadow-xs">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-amber-800 font-bold text-sm">Session abgelaufen</p>
              <p className="text-amber-700/80 text-xs mt-0.5">Dieser Termin liegt in der Vergangenheit.</p>
            </div>
          </div>
          {isCreator && (
            <button
              onClick={handleDeleteSession}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl border border-red-200 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Session header card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            {/* Sport + badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-2 bg-blue-50 text-[#2F80ED] border border-blue-200/80 font-bold px-3.5 py-1.5 rounded-full text-sm">
                <span className="text-lg">{emoji}</span>
                {sportLabel}
              </span>
              <span className="bg-orange-50 text-[#F6A94D] border border-orange-200/80 text-xs font-bold px-3 py-1 rounded-lg">
                {skillLabel}
              </span>
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-lg">
                {session.gender_filter}
              </span>
              {session.equipment && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-lg">
                  <Backpack className="w-3.5 h-3.5" />
                  Ausrüstung vorhanden
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 mb-6 leading-tight">
              {session.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-col gap-3.5 text-gray-600">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#2F80ED] shrink-0" />
                <span className="text-gray-900 font-semibold capitalize">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#2F80ED] shrink-0" />
                <span className="text-gray-900 font-semibold">{formattedTime} Uhr</span>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#2F80ED] shrink-0" />
                <div>
                  <span className="text-gray-900 font-semibold">{session.location}</span>
                  {session.address && (
                    <p className="text-gray-500 text-sm mt-0.5">{session.address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#2F80ED] shrink-0" />
                <div className="flex items-center gap-3 flex-1">
                  <span>
                    <span className={`font-bold ${isFull ? 'text-red-500' : 'text-gray-900'}`}>
                      {participants.length}
                    </span>
                    <span className="text-gray-500"> / {session.max_players} Spieler:innen</span>
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isFull ? 'bg-red-500' : 'bg-[#2F80ED]'
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
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-gray-950 font-bold mb-2">Beschreibung</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {session.description}
                </p>
              </div>
            )}

            {/* Share + delete */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#22C55E]" />
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
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-sm font-semibold px-4 py-2.5 rounded-xl border border-blue-200 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Bearbeiten
                  </button>
                  <button
                    onClick={handleDeleteSession}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Session löschen
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Chat section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-gray-100">
              <MessageCircle className="w-5 h-5 text-[#2F80ED]" />
              <h2 className="text-gray-950 font-bold">Session-Chat</h2>
              {(isParticipant || isCreator) && (
                <span className="text-gray-400 text-sm font-medium">({messages.length})</span>
              )}
            </div>

            {(isParticipant || isCreator) ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 min-h-[300px] max-h-[400px]">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
                      <p className="text-gray-900 font-bold mb-1">Noch keine Nachrichten</p>
                      <p className="text-gray-500 text-sm">
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
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                      ref={chatInputRef}
                      type="text"
                      placeholder="Nachricht schreiben..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#2F80ED] transition-colors"
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-[#0B0D17] hover:bg-black text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      aria-label="Senden"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-950 font-bold mb-1">Nur für Teilnehmer</p>
                <p className="text-gray-500 text-sm">
                  {user
                    ? 'Tritt der Session bei, um den Chat zu sehen.'
                    : <>
                        <Link to="/login" className="text-[#2F80ED] hover:underline font-semibold">
                          Melde dich an
                        </Link>{' '}
                        und tritt der Session bei.
                      </>
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Action card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="text-center mb-4">
              <p className="text-gray-500 text-sm mb-1 font-medium">Freie Plätze</p>
              <p className="text-4xl font-black text-gray-950">
                {Math.max(0, session.max_players - confirmedCount)}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                von {session.max_players} gesamt
              </p>
            </div>

            {!user ? (
              <Link
                to="/login"
                className="block w-full text-center bg-[#0B0D17] hover:bg-black text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm shadow-sm"
              >
                Anmelden & anfragen
              </Link>
            ) : isCreator ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-center">
                  <p className="text-blue-900 font-bold text-sm">Du bist der Ersteller</p>
                  <p className="text-blue-700/80 text-xs mt-0.5">Verwalte deine Session hier</p>
                </div>
                <button
                  type="button"
                  onClick={handleEditOpen}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-semibold py-3 rounded-2xl border border-blue-200 transition-colors text-sm"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Session bearbeiten</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSession}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-2xl border border-red-200 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Session löschen</span>
                </button>
              </div>
            ) : isParticipant ? (
              <div className="flex flex-col gap-2">
                {participants.find(p => p.user_id === user.id)?.waitlist ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
                    <p className="text-amber-800 font-bold text-sm">Du bist auf der Warteliste</p>
                    <p className="text-amber-700/80 text-xs mt-0.5">Du rückst automatisch nach wenn ein Platz frei wird.</p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-center">
                    <p className="text-emerald-700 font-bold text-sm">Du nimmst teil 🎉</p>
                  </div>
                )}
                <button
                  onClick={handleLeave}
                  disabled={joining}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {joining ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" /> : 'Session verlassen'}
                </button>
              </div>
            ) : joinRequest?.status === 'pending' ? (
              <div className="flex flex-col gap-2">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
                  <p className="text-amber-800 font-bold text-sm">Anfrage ausstehend</p>
                  <p className="text-amber-700/80 text-xs mt-0.5">Warte auf Bestätigung des Erstellers.</p>
                </div>
                <button
                  onClick={handleCancelRequest}
                  disabled={joining}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Anfrage zurückziehen
                </button>
              </div>
            ) : joinRequest?.status === 'rejected' ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-center">
                <p className="text-red-700 font-bold text-sm">Anfrage abgelehnt</p>
                <p className="text-red-600/80 text-xs mt-0.5">Der Ersteller hat deine Anfrage abgelehnt.</p>
              </div>
            ) : isExpired ? (
              <div className="text-center py-2">
                <p className="text-gray-500 text-sm">Diese Session ist abgelaufen.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSendRequest}
                  disabled={joining}
                  className="w-full bg-[#0B0D17] hover:bg-black text-white font-semibold py-3.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {joining
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Anfrage senden'}
                </button>

                {/* +1 / Freund mitbringen */}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => setPlusOne(p => !p)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      plusOne ? 'bg-[#2F80ED] border-[#2F80ED]' : 'border-gray-300 group-hover:border-[#2F80ED]'
                    }`}
                  >
                    {plusOne && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>
                  <span className="text-gray-600 text-xs group-hover:text-gray-900 transition-colors font-medium">
                    +1 Freund/in mitbringen <span className="text-[#2F80ED] font-semibold">(1 extra Platz)</span>
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Pending requests card — only for creator */}
          {isCreator && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-gray-950 font-bold mb-4 text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Beitrittsanfragen</span>
                {pendingRequests.length > 0 && (
                  <span className="bg-[#2F80ED] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </h3>
              {pendingRequests.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-3">Keine offenen Anfragen.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <Avatar name={req.user?.name} avatarUrl={req.user?.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-950 text-sm font-semibold truncate">{req.user?.name}</p>
                        {req.user?.city && <p className="text-gray-500 text-xs">{req.user.city}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="Akzeptieren"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Ablehnen"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Creator card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-gray-950 font-bold mb-4 text-xs uppercase tracking-wider">
              Erstellt von
            </h3>
            <div className="flex items-center gap-3">
              <Avatar
                name={session.creator?.name}
                avatarUrl={session.creator?.avatar_url}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <p className="text-gray-950 font-bold">{session.creator?.name || 'Sportis Community'}</p>
                {(session.creator?.city || session.location) && (
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {session.creator?.city || session.location}
                  </p>
                )}
                {session.creator?.reliability_score !== undefined && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
                      <div
                        className={`h-1.5 rounded-full ${
                          session.creator.reliability_score >= 80 ? 'bg-[#22C55E]' :
                          session.creator.reliability_score >= 50 ? 'bg-amber-400' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, session.creator.reliability_score)}%` }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs font-medium">{session.creator.reliability_score}% Zuverlässigkeit</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Participants card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-gray-950 font-bold mb-4 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Teilnehmer:innen</span>
              <span className="text-[#2F80ED] text-sm font-bold normal-case">
                {participants.filter(p => !p.waitlist).length}/{session.max_players}
              </span>
            </h3>

            {participants.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                Noch keine Teilnehmer:innen. Sei die/der Erste!
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-gray-50/70 border border-gray-100">
                    <Avatar name={p.user?.name} avatarUrl={p.user?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-950 text-sm font-semibold truncate">
                        {p.user?.name || 'Teilnehmer'}
                        {(p.user_id === session.creator_id || p.user_id === session.host_id) && (
                          <span className="ml-2 text-[#2F80ED] text-xs font-bold">(Ersteller:in)</span>
                        )}
                      </p>
                      <p className="text-xs">
                        {p.waitlist
                          ? <span className="text-amber-600 font-medium">Warteliste</span>
                          : p.user?.city
                          ? <span className="text-gray-500">{p.user.city}</span>
                          : null}
                      </p>
                    </div>
                    {p.user_id === user?.id ? (
                      <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                    ) : user && (
                      <div className="flex items-center gap-1 shrink-0">
                        {isCreator && p.user_id !== session.creator_id && p.user_id !== session.host_id && (
                          <button
                            onClick={() => handleRemoveParticipant(p.user_id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Entfernen"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => { setReportTarget(p.user); setReportReason('') }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
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

          {/* Weather Widget */}
          {session.lat && session.lng && (
            <WeatherWidget lat={session.lat} lng={session.lng} date={session.date} />
          )}

          {/* Equipment Checklist */}
          {(isCreator || isParticipant || equipmentItems.length > 0) && (
            <EquipmentChecklist
              sessionId={id}
              items={equipmentItems}
              setItems={setEquipmentItems}
              isCreator={isCreator}
              currentUserId={user?.id}
              isParticipant={isParticipant}
            />
          )}

          {/* Post-Game Voting */}
          {isExpired && isParticipant && (
            <PostGameVoting
              sessionId={id}
              participants={participants}
              currentUserId={user?.id}
            />
          )}
        </div>
      </div>
    </div>
  )
}
