import { useState, useEffect } from 'react'
import { Star, ThumbsUp, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

function Avatar({ name, avatarUrl }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />
  return (
    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
      {initials}
    </div>
  )
}

export default function PostGameVoting({ sessionId, participants, currentUserId }) {
  const [votes, setVotes] = useState({}) // { [toUserId]: { is_mvp, high_five } }
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load existing votes from this user
  useEffect(() => {
    supabase
      .from('reviews')
      .select('to_user_id, is_mvp, high_five')
      .eq('session_id', sessionId)
      .eq('from_user_id', currentUserId)
      .then(({ data }) => {
        if (data?.length) {
          const map = {}
          data.forEach(r => { map[r.to_user_id] = { is_mvp: r.is_mvp, high_five: r.high_five } })
          setVotes(map)
          setSubmitted(true)
        }
      })
  }, [sessionId, currentUserId])

  const toggleVote = (userId, type) => {
    if (submitted) return
    setVotes(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [type]: !prev[userId]?.[type],
      }
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      for (const [toUserId, rating] of Object.entries(votes)) {
        if (!rating.is_mvp && !rating.high_five) continue
        await supabase.rpc('submit_review', {
          p_session_id: sessionId,
          p_to_user_id: toUserId,
          p_is_mvp: !!rating.is_mvp,
          p_high_five: !!rating.high_five,
        })
      }
      setSubmitted(true)
      toast.success('Bewertungen abgegeben! 🎉')
    } catch (err) {
      toast.error('Fehler beim Speichern.')
    } finally {
      setLoading(false)
    }
  }

  const others = participants.filter(p => p.user_id !== currentUserId && !p.waitlist)

  if (others.length === 0) return null

  const mvpCount = Object.values(votes).filter(v => v?.is_mvp).length

  return (
    <div className="bg-card rounded-2xl border border-primary/20 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="text-white font-bold">Session bewertet!</h3>
      </div>
      <p className="text-muted text-sm mb-5">
        {submitted ? 'Deine Bewertungen wurden gespeichert.' : 'Vergib deinen MVP und High Fives an Mitspieler.'}
      </p>

      <div className="flex flex-col gap-3 mb-5">
        {others.map(p => {
          const v = votes[p.user_id] || {}
          return (
            <div key={p.user_id} className="flex items-center gap-3 p-3 bg-dark rounded-xl border border-white/5">
              <Avatar name={p.user?.name} avatarUrl={p.user?.avatar_url} />
              <p className="flex-1 text-white text-sm font-medium">{p.user?.name}</p>

              {/* MVP — only one allowed */}
              <button
                onClick={() => {
                  if (submitted) return
                  // Un-MVP others first
                  setVotes(prev => {
                    const next = { ...prev }
                    Object.keys(next).forEach(uid => {
                      if (uid !== p.user_id) next[uid] = { ...next[uid], is_mvp: false }
                    })
                    next[p.user_id] = { ...next[p.user_id], is_mvp: !next[p.user_id]?.is_mvp }
                    return next
                  })
                }}
                disabled={submitted}
                title="MVP"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  v.is_mvp
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                    : 'bg-white/5 text-muted border border-white/10 hover:border-yellow-500/30'
                } disabled:cursor-default`}
              >
                <Star className="w-3.5 h-3.5" />
                MVP
              </button>

              {/* High Five */}
              <button
                onClick={() => toggleVote(p.user_id, 'high_five')}
                disabled={submitted}
                title="High Five"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  v.high_five
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-white/5 text-muted border border-white/10 hover:border-primary/30'
                } disabled:cursor-default`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                +1
              </button>
            </div>
          )
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={loading || Object.keys(votes).length === 0}
          className="w-full bg-primary text-dark font-bold py-3 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50"
        >
          {loading ? 'Speichern...' : 'Bewertungen abschicken'}
        </button>
      )}
    </div>
  )
}
