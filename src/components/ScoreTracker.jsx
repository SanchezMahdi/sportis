import { useState, useEffect } from 'react'
import { TrendingUp, Award, Zap, Heart, Users, Target } from 'lucide-react'
import { supabase } from '../lib/supabase'

function StatCard({ icon: Icon, label, value, trend, color = 'text-primary' }) {
  const trendColor = trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-muted'
  
  return (
    <div className="bg-card rounded-xl border border-white/10 p-4 flex items-center gap-3">
      <div className={`${color} opacity-20`}>
        <Icon className="w-8 h-8" />
      </div>
      <div className="flex-1">
        <p className="text-muted text-xs">{label}</p>
        <div className="flex items-end gap-2">
          <p className="text-white font-black text-2xl">{value}</p>
          {trend !== undefined && (
            <span className={`text-xs font-semibold ${trendColor}`}>
              {trend > 0 ? '+' : ''}{trend}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TierBadge({ tier }) {
  const tiers = {
    'Platin': { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300', icon: '👑' },
    'Gold': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-300', icon: '🥇' },
    'Silber': { bg: 'bg-gray-400/20', border: 'border-gray-400/40', text: 'text-gray-300', icon: '🥈' },
    'Bronze': { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-300', icon: '🥉' },
  }
  
  const tierInfo = tiers[tier] || tiers['Bronze']
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${tierInfo.bg} border ${tierInfo.border}`}>
      <span className="text-lg">{tierInfo.icon}</span>
      <span className={`text-sm font-bold ${tierInfo.text}`}>{tier}</span>
    </div>
  )
}

function ScoreChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-white/10 p-8 text-center">
        <p className="text-muted">Noch keine Daten vorhanden</p>
      </div>
    )
  }

  const maxScore = Math.max(...history.map(h => h.score || 0), 100)
  
  return (
    <div className="bg-card rounded-xl border border-white/10 p-6">
      <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Score Entwicklung</h4>
      
      <div className="flex items-end gap-2 h-32">
        {history.slice(-7).map((entry, idx) => {
          const score = entry.score || 0
          const height = (score / maxScore) * 100
          const date = new Date(entry.recorded_at)
          const label = `${date.getDate()}.${date.getMonth() + 1}`
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-gradient-to-t from-primary to-green-300 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${height}%`, minHeight: '4px' }}
                title={`${score} Punkte`}
              />
              <span className="text-muted text-xs">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ScoreTracker({ userId }) {
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [ranking, setRanking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all') // 'week', 'month', 'all'

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return
      setLoading(true)
      
      try {
        // Lade aktuelles User-Profil
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, full_name, name, mvp_count, high_fives_received, sessions_played, reliability_score, avg_rating')
          .eq('id', userId)
          .single()
        
        if (userError) {
          console.warn('User nicht gefunden, verwende Fallback:', userError)
          // Fallback: Default stats
          setStats({
            id: userId,
            full_name: 'Nutzer',
            name: 'Nutzer',
            mvp_count: 0,
            high_fives_received: 0,
            sessions_played: 0,
            reliability_score: 50,
            avg_rating: 0
          })
        } else {
          setStats(userData)
        }

        // Lade Score-History (optional, nicht kritisch)
        const { data: historyData, error: historyError } = await supabase
          .from('score_history')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: true })
          .limit(30)
        
        if (!historyError && historyData) {
          setHistory(historyData)
        } else {
          setHistory([])
        }

        // Lade Ranking (optional, nicht kritisch)
        const { data: rankingData, error: rankingError } = await supabase
          .rpc('get_my_ranking', { p_user_id: userId })
        
        if (!rankingError && rankingData && rankingData.length > 0) {
          setRanking(rankingData[0])
        }
      } catch (err) {
        console.error('Fehler beim Laden der Statistiken:', err)
        // Nicht fatal, zeige default Stats
        setStats({
          id: userId,
          full_name: 'Nutzer',
          mvp_count: 0,
          high_fives_received: 0,
          sessions_played: 0,
          reliability_score: 50,
          avg_rating: 0
        })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-card rounded-xl border border-white/10 p-8 text-center">
        <p className="text-muted">Keine Daten vorhanden</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tier & Ranking Header */}
      <div className="bg-gradient-to-r from-primary/20 to-green-500/20 border border-primary/30 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-muted text-sm mb-2">Dein aktueller Tier</p>
            <TierBadge tier={ranking?.my_tier || 'Bronze'} />
          </div>
          <div className="text-right">
            <p className="text-muted text-sm">Ranking</p>
            <p className="text-white font-black text-4xl">#{ranking?.my_rank || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-muted text-sm">Score</p>
            <p className="text-primary font-black text-4xl">{ranking?.my_score || 0}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Award}
          label="MVP Awards"
          value={stats.mvp_count}
          color="text-yellow-500"
        />
        <StatCard
          icon={Heart}
          label="High Fives"
          value={stats.high_fives_received}
          color="text-red-500"
        />
        <StatCard
          icon={Users}
          label="Sessions"
          value={stats.sessions_played}
          color="text-blue-500"
        />
        <StatCard
          icon={Zap}
          label="Zuverlässigkeit"
          value={`${Math.round(stats.reliability_score)}%`}
          color="text-green-500"
        />
        <StatCard
          icon={Target}
          label="Bewertung"
          value={stats.avg_rating?.toFixed(1) || '0.0'}
          color="text-purple-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Gewinnquote"
          value={`${Math.round(stats.win_loss_ratio * 100)}%`}
          color="text-cyan-500"
        />
      </div>

      {/* Score Chart */}
      <ScoreChart history={history} />

      {/* Achievements/Badges */}
      <div className="bg-card rounded-2xl border border-white/10 p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Meilensteine
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { icon: '🏆', label: 'Erste Session', unlocked: stats.sessions_played >= 1 },
            { icon: '⭐', label: '5 MVPs', unlocked: stats.mvp_count >= 5 },
            { icon: '🙌', label: '10 High Fives', unlocked: stats.high_fives_received >= 10 },
            { icon: '💪', label: '90% Zuverlässigkeit', unlocked: stats.reliability_score >= 90 },
            { icon: '📈', label: '50 Sessions', unlocked: stats.sessions_played >= 50 },
            { icon: '👑', label: 'Platin Tier', unlocked: stats.avg_rating >= 4.5 },
          ].map((badge, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-center transition-all ${
                badge.unlocked
                  ? 'bg-primary/20 border-primary/40'
                  : 'bg-white/5 border-white/10 opacity-50'
              }`}
            >
              <p className="text-2xl mb-1">{badge.icon}</p>
              <p className={`text-xs font-semibold ${badge.unlocked ? 'text-primary' : 'text-muted'}`}>
                {badge.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 justify-center">
        {['week', 'month', 'all'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              period === p
                ? 'bg-primary text-dark'
                : 'bg-white/10 text-muted hover:bg-white/20'
            }`}
          >
            {p === 'week' ? 'Diese Woche' : p === 'month' ? 'Dieser Monat' : 'Alle Zeit'}
          </button>
        ))}
      </div>
    </div>
  )
}
