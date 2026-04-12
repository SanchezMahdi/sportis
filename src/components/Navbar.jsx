import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Zap, Menu, X, Plus, LogOut, User, Bell, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

function NotificationItem({ n, onClick }) {
  const isJoin = n.type === 'join'
  return (
    <button
      onClick={() => onClick(n)}
      className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${!n.read ? 'text-white' : 'text-muted'}`}>
            {n.message}
          </p>
          <p className="text-xs text-muted/60 mt-1">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
          </p>
        </div>
        <span className="text-lg shrink-0">{isJoin ? '🙌' : '👋'}</span>
      </div>
    </button>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notiOpen, setNotiOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const notiRef = useRef(null)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const unreadCount = notifications.filter((n) => !n.read).length

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-white'}`

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data || [])
  }

  useEffect(() => {
    if (!user) return
    fetchNotifications()

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev])
        toast(`🔔 ${payload.new.message}`, {
          style: { background: '#1E293B', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
        })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) {
        setNotiOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotiClick = async (n) => {
    // Mark as read immediately in UI
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id).eq('user_id', user.id)
    }
    if (n.session_id) {
      navigate(`/session/${n.session_id}`)
      setNotiOpen(false)
    }
  }

  const markAllRead = async () => {
    if (unreadCount === 0) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .or('read.eq.false,read.is.null')
  }

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
          <Link to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
            <div className="bg-primary rounded-lg p-1.5 group-hover:bg-green-400 transition-colors">
              <Zap className="w-5 h-5 text-dark" fill="currentColor" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              sport<span className="text-primary">is</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/entdecken" className={navLinkClass}>Entdecken</NavLink>
            <NavLink to="/plaetze" className={navLinkClass}>Plätze</NavLink>
            {user && <NavLink to="/dashboard" className={navLinkClass}>Meine Sessions</NavLink>}
            {user && <NavLink to="/profil" className={navLinkClass}>Profil</NavLink>}
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

                {/* Notifications bell */}
                <div className="relative" ref={notiRef}>
                  <button
                    onClick={() => setNotiOpen(!notiOpen)}
                    className="relative p-2 text-muted hover:text-white transition-colors"
                    title="Benachrichtigungen"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-dark text-xs font-black rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notiOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h3 className="text-white font-bold text-sm">Benachrichtigungen</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-primary text-xs hover:text-green-400 transition-colors">
                            Alle gelesen
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell className="w-8 h-8 text-muted/30 mx-auto mb-2" />
                            <p className="text-muted text-sm">Keine Benachrichtigungen</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <NotificationItem key={n.id} n={n} onClick={handleNotiClick} />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

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
                <Link to="/login" className="text-muted hover:text-white text-sm font-medium transition-colors">
                  Anmelden
                </Link>
                <Link to="/login" className="flex items-center gap-2 bg-primary text-dark text-sm font-bold px-4 py-2 rounded-lg hover:bg-green-400 transition-colors">
                  Registrieren
                </Link>
              </>
            )}
          </div>

          {/* Mobile: bell + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <div className="relative" ref={notiRef}>
                <button
                  onClick={() => setNotiOpen(!notiOpen)}
                  className="relative p-2 text-muted hover:text-white transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-dark text-xs font-black rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notiOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <h3 className="text-white font-bold text-sm">Benachrichtigungen</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-primary text-xs hover:text-green-400 transition-colors">
                          Alle gelesen
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-muted text-sm">Keine Benachrichtigungen</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <NotificationItem key={n.id} n={n} onClick={handleNotiClick} />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-muted hover:text-white transition-colors"
              aria-label="Menü öffnen"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-dark/95 backdrop-blur-md">
          <div className="px-4 py-4 flex flex-col gap-4">
            <NavLink to="/entdecken" className={({ isActive }) => `text-base font-medium py-2 transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-white'}`} onClick={closeMenu}>
              Entdecken
            </NavLink>
            <NavLink to="/plaetze" className={({ isActive }) => `text-base font-medium py-2 transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-white'}`} onClick={closeMenu}>
              Plätze
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className={({ isActive }) => `text-base font-medium py-2 transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-white'}`} onClick={closeMenu}>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Meine Sessions
                </span>
              </NavLink>
            )}
            {user && (
              <NavLink to="/profil" className={({ isActive }) => `text-base font-medium py-2 transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-white'}`} onClick={closeMenu}>
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profil
                </span>
              </NavLink>
            )}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
              {user ? (
                <>
                  <Link to="/session/erstellen" className="flex items-center justify-center gap-2 bg-primary text-dark text-sm font-bold px-4 py-3 rounded-lg hover:bg-green-400 transition-colors" onClick={closeMenu}>
                    <Plus className="w-4 h-4" />
                    Session erstellen
                  </Link>
                  <button onClick={handleSignOut} className="flex items-center justify-center gap-2 text-muted hover:text-white text-sm font-medium transition-colors py-2">
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-center text-muted hover:text-white text-sm font-medium transition-colors py-2" onClick={closeMenu}>
                    Anmelden
                  </Link>
                  <Link to="/login" className="flex items-center justify-center gap-2 bg-primary text-dark text-sm font-bold px-4 py-3 rounded-lg hover:bg-green-400 transition-colors" onClick={closeMenu}>
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
