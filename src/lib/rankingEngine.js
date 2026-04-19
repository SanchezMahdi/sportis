/**
 * Ranking Engine für Sportis
 * Berechnet Score, Tier und Leaderboard-Position
 */

// Tier-Definitionen
export const TIERS = {
  BRONZE: { name: 'Bronze', minScore: 0, maxScore: 1499, color: '#D97706', icon: '🥉' },
  SILVER: { name: 'Silber', minScore: 1500, maxScore: 2999, color: '#D1D5DB', icon: '🥈' },
  GOLD: { name: 'Gold', minScore: 3000, maxScore: 4999, color: '#FCD34D', icon: '🥇' },
  PLATINUM: { name: 'Platin', minScore: 5000, maxScore: Infinity, color: '#60A5FA', icon: '👑' },
}

/**
 * Berechne Gesamt-Score für einen Nutzer
 * Formel: MVP (25%) + High-Fives (15%) + Zuverlässigkeit (30%) + Volume (10%) + Rating (20%)
 */
export function calculateRankingScore(user) {
  if (!user) return 0

  const mvpScore = (user.mvp_count || 0) * 25
  const highFiveScore = (user.high_fives_received || 0) * 15
  const reliabilityScore = user.reliability_score || 50
  const volumeScore = Math.min(user.sessions_played || 0, 100) * 1 // capped at 100
  const ratingScore = (user.avg_rating || 0) * 20

  const totalScore = Math.round(
    mvpScore * 0.25 +
    highFiveScore * 0.15 +
    reliabilityScore * 0.30 +
    volumeScore * 0.10 +
    ratingScore * 0.20
  )

  return Math.max(0, totalScore)
}

/**
 * Bestimme Tier basierend auf Score
 */
export function getTierFromScore(score) {
  if (score >= TIERS.PLATINUM.minScore) return TIERS.PLATINUM
  if (score >= TIERS.GOLD.minScore) return TIERS.GOLD
  if (score >= TIERS.SILVER.minScore) return TIERS.SILVER
  return TIERS.BRONZE
}

/**
 * Formatiere Score für Anzeige
 */
export function formatScore(score) {
  return score.toLocaleString('de-DE')
}

/**
 * Berechne Progress zur nächsten Tier
 */
export function getProgressToNextTier(score) {
  const currentTier = getTierFromScore(score)
  const nextTier = Object.values(TIERS).find(t => t.minScore > score)
  
  if (!nextTier) {
    return { current: 100, next: null, remaining: 0 }
  }

  const currentMin = currentTier.minScore
  const nextMin = nextTier.minScore
  const totalDistance = nextMin - currentMin
  const currentProgress = score - currentMin
  const progressPercent = (currentProgress / totalDistance) * 100

  return {
    current: Math.round(progressPercent),
    next: nextTier,
    remaining: nextMin - score,
  }
}

/**
 * Vergleiche zwei Nutzer
 */
export function compareUsers(user1, user2) {
  const score1 = calculateRankingScore(user1)
  const score2 = calculateRankingScore(user2)
  
  return {
    user1: {
      score: score1,
      tier: getTierFromScore(score1),
    },
    user2: {
      score: score2,
      tier: getTierFromScore(score2),
    },
    difference: score1 - score2,
    winner: score1 > score2 ? 1 : score2 > score1 ? 2 : 0,
  }
}

/**
 * Sortiere Nutzer nach Score
 */
export function sortByRanking(users) {
  return [...users].sort((a, b) => {
    const scoreA = calculateRankingScore(a)
    const scoreB = calculateRankingScore(b)
    return scoreB - scoreA
  })
}

/**
 * Finde Nutzer-Rang in einer Liste
 */
export function findUserRank(users, userId) {
  const sorted = sortByRanking(users)
  return sorted.findIndex(u => u.id === userId) + 1
}

/**
 * Berechne Ranking-Änderung (für Trends)
 */
export function calculateRankChange(previousHistory, currentScore) {
  if (!previousHistory || previousHistory.length === 0) {
    return { change: 0, direction: 'neutral' }
  }

  const previousScore = previousHistory[previousHistory.length - 1]?.score || 0
  const change = currentScore - previousScore

  return {
    change: Math.abs(change),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    percentage: previousScore > 0 ? ((change / previousScore) * 100).toFixed(1) : 0,
  }
}

/**
 * Kategorisiere Nutzer in Stufen
 */
export function categorizeUsersByTier(users) {
  const categories = {
    platinum: [],
    gold: [],
    silver: [],
    bronze: [],
  }

  users.forEach(user => {
    const score = calculateRankingScore(user)
    const tier = getTierFromScore(score)
    
    if (tier === TIERS.PLATINUM) categories.platinum.push(user)
    else if (tier === TIERS.GOLD) categories.gold.push(user)
    else if (tier === TIERS.SILVER) categories.silver.push(user)
    else categories.bronze.push(user)
  })

  return categories
}

/**
 * Berechne Durchschnitt eines Tiers
 */
export function calculateTierAverage(users) {
  const tierDistribution = categorizeUsersByTier(users)
  
  return {
    platinum: tierDistribution.platinum.length,
    gold: tierDistribution.gold.length,
    silver: tierDistribution.silver.length,
    bronze: tierDistribution.bronze.length,
    total: users.length,
  }
}

export default {
  calculateRankingScore,
  getTierFromScore,
  formatScore,
  getProgressToNextTier,
  compareUsers,
  sortByRanking,
  findUserRank,
  calculateRankChange,
  categorizeUsersByTier,
  calculateTierAverage,
}
