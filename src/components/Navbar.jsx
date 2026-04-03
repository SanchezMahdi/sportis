import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Zap, Menu, X, Plus, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-primary' : 'text-muted hover:text-white'
    }`

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Erfolgreich abgemeldet!')
      navigate('/')
    } catch {
      toast.error('Fehler beim Abmelden')
    }
    setMenuOpen(false)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="sticky top-0 z-50 bg-dark/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={closeMenu}
          >
            <div className="bg-primary rounded-lg p-1.5 group-hover:bg-green-400 transition-colors">
              <Zap className="w-5 h-5 text-dark" fill="currentColor" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              sport<span className="text-primary">is</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/entdecken" className={navLinkClass}>
              Entdecken
            </NavLink>
            <NavLink to="/plaetze" className={navLinkClass}>
              Plätze
            </NavLink>
            {user && (
              <NavLink to="/profil" className={navLinkClass}>
                Profil
              </NavLink>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/session/erstellen"
                  className="flex items-center gap-2 bg-primary text-dark text-sm font-bold px-4 py-2 rounded-lg hover:bg-green-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Session erstellen
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-muted hover:text-white text-sm font-medium transition-colors px-2 py-2"
                  title="Abmelden"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-muted hover:text-white text-sm font-medium transition-colors"
                >
                  Anmelden
                </Link>
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-primary text-dark text-sm font-bold px-4 py-2 rounded-lg hover:bg-green-400 transition-colors"
                >
                  Registrieren
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-muted hover:text-white transition-colors"
            aria-label="Menü öffnen"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-dark/95 backdrop-blur-md">
          <div className="px-4 py-4 flex flex-col gap-4">
            <NavLink
              to="/entdecken"
              className={({ isActive }) =>
                `text-base font-medium py-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted hover:text-white'
                }`
              }
              onClick={closeMenu}
            >
              Entdecken
            </NavLink>
            <NavLink
              to="/plaetze"
              className={({ isActive }) =>
                `text-base font-medium py-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted hover:text-white'
                }`
              }
              onClick={closeMenu}
            >
              Plätze
            </NavLink>
            {user && (
              <NavLink
                to="/profil"
                className={({ isActive }) =>
                  `text-base font-medium py-2 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted hover:text-white'
                  }`
                }
                onClick={closeMenu}
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profil
                </span>
              </NavLink>
            )}

            <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    to="/session/erstellen"
                    className="flex items-center justify-center gap-2 bg-primary text-dark text-sm font-bold px-4 py-3 rounded-lg hover:bg-green-400 transition-colors"
                    onClick={closeMenu}
                  >
                    <Plus className="w-4 h-4" />
                    Session erstellen
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-2 text-muted hover:text-white text-sm font-medium transition-colors py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-center text-muted hover:text-white text-sm font-medium transition-colors py-2"
                    onClick={closeMenu}
                  >
                    Anmelden
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 bg-primary text-dark text-sm font-bold px-4 py-3 rounded-lg hover:bg-green-400 transition-colors"
                    onClick={closeMenu}
                  >
                    Registrieren
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
