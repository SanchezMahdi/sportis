import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, User, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function FigmaNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isLanding = location.pathname === '/'

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Erfolgreich abgemeldet!')
      navigate('/')
    } catch {
      toast.error('Fehler beim Abmelden')
    }
    setMobileOpen(false)
  }

  const scrollToSection = (id) => {
    setMobileOpen(false)
    if (location.pathname !== '/') {
      navigate(`/#${id}`)
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="font-['Outfit',sans-serif] text-2xl font-black tracking-tight text-gray-950 hover:text-[#5B3FE9] transition-colors">
              Sportis
            </span>
          </Link>

          {/* Desktop Navigation Links (Consistent across Figma design) */}
          <nav className="hidden md:flex items-center gap-10">
            <a 
              href="#about-us" 
              onClick={(e) => { e.preventDefault(); scrollToSection('about-us') }}
              className={`text-[15px] font-medium transition-colors ${
                location.hash === '#about-us' ? 'text-gray-950 font-bold' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              About us
            </a>
            <a 
              href="#pictures" 
              onClick={(e) => { e.preventDefault(); scrollToSection('pictures') }}
              className={`text-[15px] font-medium transition-colors ${
                location.hash === '#pictures' ? 'text-gray-950 font-bold' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              Pictures
            </a>
            <Link 
              to="/sessions" 
              className={`text-[15px] font-medium transition-colors ${
                location.pathname === '/sessions' ? 'text-[#5B3FE9] font-bold' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              Session
            </Link>
            <a 
              href="#how-it-works" 
              onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works') }}
              className={`text-[15px] font-medium transition-colors ${
                location.hash === '#how-it-works' || location.hash === '#campus-league' ? 'text-gray-950 font-bold' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              How it Works
            </a>
          </nav>

          {/* Right Action */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  to="/profil" 
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200/80 hover:border-[#5B3FE9] transition-all shadow-xs bg-gray-100 flex items-center justify-center"
                  title="Mein Profil"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profil" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-500" />
                  )}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-50"
                  title="Abmelden"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-[#5033E0] hover:bg-[#432bc2] text-white font-medium text-[15px] px-7 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                Log in
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              aria-label="Menü öffnen"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-6 py-5 shadow-lg">
          <div className="flex flex-col gap-4">
            <a
              href="#about-us"
              onClick={(e) => { e.preventDefault(); scrollToSection('about-us') }}
              className="text-base font-medium text-gray-700 hover:text-gray-900"
            >
              About us
            </a>
            <a
              href="#pictures"
              onClick={(e) => { e.preventDefault(); scrollToSection('pictures') }}
              className="text-base font-medium text-gray-700 hover:text-gray-900"
            >
              Pictures
            </a>
            <Link
              to="/sessions"
              onClick={() => setMobileOpen(false)}
              className="text-base font-medium text-gray-700 hover:text-gray-900"
            >
              Sessions
            </Link>
            <Link
              to="/events"
              onClick={() => setMobileOpen(false)}
              className="text-base font-medium text-gray-700 hover:text-gray-900"
            >
              Events
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works') }}
              className="text-base font-medium text-gray-700 hover:text-gray-900"
            >
              How it Works
            </a>
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    to="/session/erstellen"
                    onClick={() => setMobileOpen(false)}
                    className="bg-gradient-to-r from-[#5B3FE9] to-[#4534C7] text-white text-center font-semibold py-3 rounded-lg shadow-sm"
                  >
                    Session erstellen
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-medium text-gray-700 hover:text-gray-900"
                  >
                    Meine Sessions
                  </Link>
                  <Link
                    to="/profil"
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-medium text-gray-700 hover:text-gray-900"
                  >
                    Profil
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-left text-base font-medium text-red-600 hover:text-red-700"
                  >
                    Abmelden
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="bg-gradient-to-r from-[#5B3FE9] to-[#4534C7] text-white text-center font-semibold py-3 rounded-lg shadow-sm"
                >
                  Anmelden / Registrieren
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
