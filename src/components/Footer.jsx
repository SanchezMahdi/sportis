import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-card border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Logo & tagline */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary rounded-lg p-1.5 group-hover:bg-green-400 transition-colors">
                <Zap className="w-4 h-4 text-dark" fill="currentColor" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                sport<span className="text-primary">is</span>
              </span>
            </Link>
            <p className="text-muted text-sm text-center md:text-left max-w-xs">
              Deine Sport-Community für alle Sportarten und alle Menschen.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-white text-sm font-semibold">Entdecken</p>
              <Link
                to="/entdecken"
                className="text-muted hover:text-white text-sm transition-colors"
              >
                Sessions
              </Link>
              <Link
                to="/plaetze"
                className="text-muted hover:text-white text-sm transition-colors"
              >
                Plätze
              </Link>
              <Link
                to="/session/erstellen"
                className="text-muted hover:text-white text-sm transition-colors"
              >
                Session erstellen
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-white text-sm font-semibold">Konto</p>
              <Link
                to="/profil"
                className="text-muted hover:text-white text-sm transition-colors"
              >
                Profil
              </Link>
              <Link
                to="/login"
                className="text-muted hover:text-white text-sm transition-colors"
              >
                Anmelden
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted text-xs">
            © 2026 Sportis. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/impressum" className="text-muted hover:text-white text-xs transition-colors">
              Impressum
            </Link>
            <Link to="/datenschutz" className="text-muted hover:text-white text-xs transition-colors">
              Datenschutz
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
