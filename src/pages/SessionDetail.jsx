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
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORT_EMOJIS, SKILL_COLORS } from '../lib/constants'
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
          // Fetch the full message with user info
          const { data } = await supabase
            .from('messages')
            .select('*, user:users(id, name, avatar_url)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages((prev) => [...prev, data])
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

    try {
      const { error } = await supabase.from('messages').insert({
        session_id: id,
        user_id: user.id,
        text,
      })

      if (error) throw error
    } catch (err) {
      console.error('Nachricht konnte nicht gesendet werden:', err)
      toast.error('Nachricht konnte nicht gesendet werden.')
      setNewMessage(text)
    } finally {
      setSending(false)
      chatInputRef.current?.focus()
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      toast.success('Link kopiert!')
      setTimeout(() => setCopied(false), 2000)
    })
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
                <button
                  onClick={handleDeleteSession}
                  className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Session löschen
                </button>
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
                  <div key={p.id} className="flex items-center gap-3">
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
                    {p.user_id === user?.id && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
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
