import { useState } from 'react'
import { ArrowLeft, Trophy, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SPORTARTEN, SPORT_EMOJIS } from '../lib/constants'
import RankingLeaderboard from '../components/RankingLeaderboard'

export default function Ranking() {
  const { user } = useAuth()
  const [selectedSport, setSelectedSport] = useState(null)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/entdecken" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" />
            Ranking & Leaderboard
          </h1>
          <p className="text-muted mt-1">Vergleich dich mit anderen Spielern</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-card rounded-2xl border border-white/10 p-6 mb-8">
        <div className="flex items-start gap-4">
          <TrendingUp className="w-6 h-6 text-primary shrink-0 mt-1" />
          <div>
            <h3 className="text-white font-semibold mb-2">Wie funktioniert das Ranking?</h3>
            <p className="text-muted text-sm leading-relaxed">
              Dein Ranking basiert auf deiner Leistung in Sessions. Verdiene Punkte durch:
              <span className="block mt-2 space-y-1">
                <span>🏆 <strong>MVP Awards</strong> (25% Gewichtung) – Beste Spieler:in einer Session</span>
                <span>🙌 <strong>High Fives</strong> (15% Gewichtung) – Anerkannte gute Leistungen</span>
                <span>⚡ <strong>Zuverlässigkeit</strong> (30% Gewichtung) – Pünktlichkeit & Teilnahme</span>
                <span>📊 <strong>Session-Volumen</strong> (10% Gewichtung) – Wie oft du spielst</span>
                <span>⭐ <strong>Bewertungen</strong> (20% Gewichtung) – Durchschnittliche Ratings</span>
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Sport Filter */}
      <div className="mb-8">
        <h3 className="text-white font-semibold mb-4">Ranking nach Sportart</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* All button */}
          <button
            onClick={() => setSelectedSport(null)}
            className={`p-4 rounded-xl border-2 font-semibold transition-all text-center ${
              selectedSport === null
                ? 'bg-primary border-primary text-dark'
                : 'bg-card border-white/10 text-white hover:border-primary'
            }`}
          >
            Alle
          </button>

          {/* Sport buttons */}
          {SPORTARTEN.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`p-4 rounded-xl border-2 font-semibold transition-all text-center ${
                selectedSport === sport
                  ? 'bg-primary border-primary text-dark'
                  : 'bg-card border-white/10 text-white hover:border-primary'
              }`}
            >
              <span className="text-2xl mb-1 block">{SPORT_EMOJIS[sport]}</span>
              <span className="text-xs">{sport}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-card rounded-2xl border border-white/10 p-6">
        <RankingLeaderboard 
          currentUserId={user?.id}
          sport={selectedSport}
        />
      </div>

      {/* Footer Info */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <p className="text-muted text-sm mb-2">👑 Platin</p>
          <p className="text-white font-black text-2xl">5000+</p>
          <p className="text-muted text-xs mt-1">Punkte</p>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <p className="text-muted text-sm mb-2">🥇 Gold</p>
          <p className="text-white font-black text-2xl">3000+</p>
          <p className="text-muted text-xs mt-1">Punkte</p>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <p className="text-muted text-sm mb-2">🥈 Silber</p>
          <p className="text-white font-black text-2xl">1500+</p>
          <p className="text-muted text-xs mt-1">Punkte</p>
        </div>
      </div>
    </div>
  )
}
