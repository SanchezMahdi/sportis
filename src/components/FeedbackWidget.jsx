import { useState } from 'react'
import { MessageSquarePlus, X, Send, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLocation } from 'react-router-dom'

const MOODS = [
  { value: 'gut',     label: 'Gut',     emoji: '😊' },
  { value: 'neutral', label: 'Ok',      emoji: '😐' },
  { value: 'schlecht',label: 'Schlecht',emoji: '😞' },
]

export default function FeedbackWidget() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const reset = () => {
    setMood(null)
    setMessage('')
    setDone(false)
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(reset, 300)
  }

  const handleSubmit = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await supabase.from('feedback').insert({
        user_id: user?.id ?? null,
        mood: mood ?? null,
        message: message.trim(),
        page: location.pathname,
      })
      setDone(true)
      setTimeout(handleClose, 2200)
    } catch {
      // silent — feedback is best-effort
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating trigger button — safe-area-aware so iOS Safari bar doesn't cover it */}
      <button
        onClick={() => { setOpen(true); reset() }}
        aria-label="Feedback geben"
        className={`fixed right-4 z-50 flex items-center gap-2 bg-primary text-dark font-bold text-sm px-4 py-3 rounded-full shadow-lg shadow-primary/20 hover:bg-green-400 active:scale-95 transition-all ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <MessageSquarePlus className="w-4 h-4" />
        Feedback
      </button>

      {/* Panel — full-width on mobile, fixed 320px on desktop */}
      <div
        className={`fixed right-0 left-0 sm:left-auto sm:right-4 sm:w-80 z-50 px-4 sm:px-0 transition-all duration-300 ${
          open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-primary" />
              <span className="text-white font-bold text-sm">Feedback</span>
            </div>
            <button
              onClick={handleClose}
              className="text-white/30 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          {done ? (
            <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <p className="text-white font-semibold text-sm">Danke für dein Feedback!</p>
              <p className="text-white/40 text-xs">Wir arbeiten ständig daran, sportis besser zu machen.</p>
            </div>
          ) : (
            <div className="px-5 py-5 space-y-4">

              {/* Mood */}
              <div>
                <p className="text-white/50 text-xs mb-3 uppercase tracking-wider font-semibold">Wie war deine Erfahrung?</p>
                <div className="flex gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all min-h-[64px] ${
                        mood === m.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-white/5 bg-white/[0.03] text-white/40 hover:border-white/10 hover:text-white/60'
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-white/50 text-xs mb-2 uppercase tracking-wider font-semibold">Deine Nachricht</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  placeholder="Was können wir besser machen?"
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/5 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-primary/50 resize-none transition-colors leading-relaxed"
                />
                <p className="text-white/20 text-xs text-right mt-1">{message.length}/1000</p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="w-full flex items-center justify-center gap-2 bg-primary text-dark font-bold text-sm py-3 rounded-xl hover:bg-green-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-dark/40 border-t-dark rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Absenden
                  </>
                )}
              </button>

            </div>
          )}
        </div>
      </div>
    </>
  )
}
