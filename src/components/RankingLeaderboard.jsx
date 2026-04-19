import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, Trophy, Search, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getTierFromScore, calculateRankingScore } from '../lib/rankingEngine'

function Avatar({ name, avatarUrl, size = 'sm' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }
  
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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
    <div className={`${sizes[size]} rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold`}>
      {initials}
    </div>
  )
}

function RankingRow({ user, rank, currentUserId, trend }) {
  const score = calculateRankingScore(user)
  const tier = getTierFromScore(score)
  const isCurrentUser = (user.id || user.user_id) === currentUserId

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
      isCurrentUser
        ? 'bg-primary/10 border-primary/40'
        : 'bg-card border-white/5 hover:border-white/10'
    }`}>
      {/* Rang */}
      <div className="w-12 text-center">
        <p className={`text-lg font-black ${
          rank === 1 ? 'text-yellow-400' :
          rank === 2 ? 'text-gray-300' :
          rank === 3 ? 'text-orange-400' :
          'text-muted'
        }`}>
          {rank}
        </p>
      </div>

      {/* Tier Icon */}
      <div className="text-2xl">{tier.icon}</div>

      {/* Avatar & Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar name={user.full_name || user.name || 'User'} avatarUrl={user.avatar_url} size="md" />
        <div className="min-w-0">
          <p className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
            {user.full_name || user.name || 'Anonym'}
          </p>
          <p className="text-muted text-xs">{user.city || '—'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-xs">
        <div className="text-center">
          <p className="text-muted">MVPs</p>
          <p className="text-white font-bold">{user.mvp_count || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-muted">High Fives</p>
          <p className="text-white font-bold">{user.high_fives_received || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-muted">Sessions</p>
          <p className="text-white font-bold">{user.sessions_played || 0}</p>
        </div>
      </div>

      {/* Score */}
      <div className="text-right min-w-[80px]">
        <p className="text-primary font-black text-lg">{score}</p>
        <p className="text-muted text-xs">{tier.name}</p>
      </div>

      {/* Trend */}
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${
          trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-muted'
        }`}>
          {trend > 0 && <ChevronUp className="w-3 h-3" />}
          {trend < 0 && <ChevronDown className="w-3 h-3" />}
          {Math.abs(trend)}
        </div>
      )}
    </div>
  )
}

export default function RankingLeaderboard({ currentUserId, sport = null }) {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState('all') // 'all', 'platinum', 'gold', 'silver', 'bronze'
  const [sortBy, setSortBy] = useState('score') // 'score', 'mvp', 'reliability'

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true)
      try {
        // Versuche Ranking RPC aufzurufen
        const { data, error } = await supabase
          .rpc('get_user_ranking', { 
            p_sport: sport,
            p_city: null,
          })

        if (error) {
          // Fallback: Lade alle User direkt aus der DB
          console.warn('RPC-Fehler, lade Fallback-Daten...', error)
          const { data: allUsers, error: dbError } = await supabase
            .from('users')
            .select('*')
            .limit(50)
          
          if (dbError) throw dbError
          const userList = Array.isArray(allUsers) ? allUsers : []
          setUsers(userList)
        } else {
          // Konvertiere zu Array falls nicht schon
          const userList = Array.isArray(data) ? data : data ? [data] : []
          setUsers(userList)
        }
      } catch (err) {
        console.error('Fehler beim Laden des Leaderboards:', err)
        // Noch ein Fallback: Leere Liste statt Crash
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [sport])

  // Filter & Search
  useEffect(() => {
    let filtered = [...users]

    // Filter nach Tier
    if (filterTier !== 'all') {
      filtered = filtered.filter(u => {
        const tier = getTierFromScore(calculateRankingScore(u))
        const tierNames = {
          platinum: 'Platin',
          gold: 'Gold',
          silver: 'Silber',
          bronze: 'Bronze',
        }
        return tier.name === tierNames[filterTier]
      })
    }

    // Suche
    if (searchQuery.trim()) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.city && u.city.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Sortieren
    if (sortBy === 'mvp') {
      filtered.sort((a, b) => (b.mvp_count || 0) - (a.mvp_count || 0))
    } else if (sortBy === 'reliability') {
      filtered.sort((a, b) => (b.reliability_score || 0) - (a.reliability_score || 0))
    }
    // sortBy === 'score' ist bereits von der API sortiert

    setFilteredUsers(filtered)
  }, [users, searchQuery, filterTier, sortBy])

  const currentUserRank = filteredUsers.findIndex(u => u.id === currentUserId) + 1

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header mit Current User Info */}
      {currentUserId && users.length > 0 && (
        <div className="bg-gradient-to-r from-primary/20 to-green-500/20 border border-primary/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted text-sm">Dein Ranking</p>
              <p className="text-white font-black text-3xl">#{currentUserRank || '—'}</p>
            </div>
            <Trophy className="w-12 h-12 text-primary opacity-30" />
          </div>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Nach Name oder Stadt suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark border border-white/10 rounded-xl text-white placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-4 py-2.5 bg-dark border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none transition-colors text-sm font-medium"
          >
            <option value="all">Alle Tiers</option>
            <option value="platinum">👑 Platin</option>
            <option value="gold">🥇 Gold</option>
            <option value="silver">🥈 Silber</option>
            <option value="bronze">🥉 Bronze</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-dark border border-white/10 rounded-xl text-white focus:border-primary focus:outline-none transition-colors text-sm font-medium"
          >
            <option value="score">Nach Score</option>
            <option value="mvp">Nach MVPs</option>
            <option value="reliability">Nach Zuverlässigkeit</option>
          </select>
        </div>
      </div>

      {/* Leaderboard */}
      {filteredUsers.length === 0 ? (
        <div className="bg-card rounded-xl border border-white/10 p-12 text-center">
          <Filter className="w-12 h-12 text-muted/20 mx-auto mb-3" />
          <p className="text-muted">Keine Nutzer gefunden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user, index) => (
            <RankingRow
              key={user.id || user.user_id || index}
              user={user}
              rank={index + 1}
              currentUserId={currentUserId}
              trend={user.rank_change}
            />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <div className="grid grid-cols-4 gap-3 text-center py-4 bg-card rounded-xl border border-white/10">
        <div>
          <p className="text-muted text-xs">Gesamt</p>
          <p className="text-white font-black">{users.length}</p>
        </div>
        <div>
          <p className="text-muted text-xs">👑 Platin</p>
          <p className="text-blue-400 font-black">{users.filter(u => getTierFromScore(calculateRankingScore(u)).name === 'Platin').length}</p>
        </div>
        <div>
          <p className="text-muted text-xs">🥇 Gold</p>
          <p className="text-yellow-400 font-black">{users.filter(u => getTierFromScore(calculateRankingScore(u)).name === 'Gold').length}</p>
        </div>
        <div>
          <p className="text-muted text-xs">🥈 Silber</p>
          <p className="text-gray-300 font-black">{users.filter(u => getTierFromScore(calculateRankingScore(u)).name === 'Silber').length}</p>
        </div>
      </div>
    </div>
  )
}
