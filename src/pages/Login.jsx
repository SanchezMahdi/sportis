import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap, Eye, EyeOff, Mail, Lock, User, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { SPORTARTEN, GENDER_FILTERS } from '../lib/constants'

function InputField({ label, error, icon: Icon, ...props }) {
  const [showPass, setShowPass] = useState(false)
  const isPassword = props.type === 'password'
  const inputType = isPassword ? (showPass ? 'text' : 'password') : props.type

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-white text-sm font-medium">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        )}
        <input
          {...props}
          type={inputType}
          className={`w-full bg-dark border rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-primary transition-colors ${
            Icon ? 'pl-10' : ''
          } ${isPassword ? 'pr-10' : ''} ${
            error ? 'border-red-500' : 'border-white/10 focus:border-primary'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

export default function Login() {
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()

  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [loginErrors, setLoginErrors] = useState({})

  // Register form
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    city: '',
    gender: '',
    sports: [],
  })
  const [registerErrors, setRegisterErrors] = useState({})

  useEffect(() => {
    if (user) {
      navigate('/entdecken')
    }
  }, [user, navigate])

  // Login validation
  const validateLogin = () => {
    const errors = {}
    if (!loginData.email) errors.email = 'E-Mail ist erforderlich'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email))
      errors.email = 'Ungültige E-Mail-Adresse'
    if (!loginData.password) errors.password = 'Passwort ist erforderlich'
    return errors
  }

  // Register validation
  const validateRegister = () => {
    const errors = {}
    if (!registerData.name.trim()) errors.name = 'Name ist erforderlich'
    if (!registerData.email) errors.email = 'E-Mail ist erforderlich'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email))
      errors.email = 'Ungültige E-Mail-Adresse'
    if (!registerData.password) errors.password = 'Passwort ist erforderlich'
    else if (registerData.password.length < 6)
      errors.password = 'Passwort muss mindestens 6 Zeichen haben'
    return errors
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const errors = validateLogin()
    setLoginErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    try {
      await signIn(loginData.email, loginData.password)
      toast.success('Willkommen zurück!')
      navigate('/entdecken')
    } catch (err) {
      const msg = err?.message || ''
      if (msg.includes('Invalid login credentials')) {
        toast.error('E-Mail oder Passwort ist falsch.')
      } else if (msg.includes('Email not confirmed')) {
        toast.error('Bitte bestätige zuerst deine E-Mail-Adresse.')
      } else {
        toast.error('Anmeldung fehlgeschlagen. Bitte versuche es erneut.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const errors = validateRegister()
    setRegisterErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    try {
      await signUp(registerData.email, registerData.password, {
        name: registerData.name,
        city: registerData.city,
        gender: registerData.gender,
        sports: registerData.sports,
      })
      toast.success('Registrierung erfolgreich! Willkommen bei Sportis!')
      navigate('/entdecken')
    } catch (err) {
      console.error('Registrierung fehlgeschlagen:', err)
      const msg = err?.message || ''
      if (msg.includes('User already registered') || msg.includes('already been registered')) {
        toast.error('Diese E-Mail-Adresse ist bereits registriert.')
      } else if (msg.includes('Password should be')) {
        toast.error('Passwort zu schwach. Mindestens 6 Zeichen verwenden.')
      } else if (msg.includes('Database error saving new user')) {
        toast.error('Registrierung fehlgeschlagen: Datenbank-Profil konnte nicht erstellt werden.')
      } else if (msg.includes('Signups not allowed')) {
        toast.error('Registrierung ist in Supabase aktuell deaktiviert.')
      } else if (msg.includes('Invalid API key') || msg.includes('JWT')) {
        toast.error('Registrierung fehlgeschlagen: Supabase API-Key ist ungültig.')
      } else if (msg.includes('rate limit')) {
        toast.error('Zu viele Registrierungsversuche. Bitte später erneut versuchen.')
      } else {
        toast.error('Registrierung fehlgeschlagen. Bitte versuche es erneut.')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleSport = (sport) => {
    setRegisterData((prev) => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter((s) => s !== sport)
        : [...prev.sports, sport],
    }))
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group mb-6">
            <div className="bg-primary rounded-lg p-2 group-hover:bg-green-400 transition-colors">
              <Zap className="w-6 h-6 text-dark" fill="currentColor" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">
              sport<span className="text-primary">is</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">
            {tab === 'login' ? 'Willkommen zurück!' : 'Werde Teil der Community'}
          </h1>
          <p className="text-muted text-sm mt-1">
            {tab === 'login'
              ? 'Melde dich an, um loszulegen.'
              : 'Erstelle dein kostenloses Konto.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-card rounded-xl p-1 mb-8 border border-white/10">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-primary text-dark shadow'
                : 'text-muted hover:text-white'
            }`}
          >
            Anmelden
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-primary text-dark shadow'
                : 'text-muted hover:text-white'
            }`}
          >
            Registrieren
          </button>
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <InputField
              label="E-Mail"
              type="email"
              icon={Mail}
              placeholder="name@beispiel.de"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              error={loginErrors.email}
              autoComplete="email"
            />
            <InputField
              label="Passwort"
              type="password"
              icon={Lock}
              placeholder="Dein Passwort"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              error={loginErrors.password}
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-dark font-bold py-3.5 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                  Anmelden...
                </>
              ) : (
                'Anmelden'
              )}
            </button>

            <p className="text-center text-muted text-sm">
              Noch kein Konto?{' '}
              <button
                type="button"
                onClick={() => setTab('register')}
                className="text-primary hover:text-green-400 font-medium transition-colors"
              >
                Jetzt registrieren
              </button>
            </p>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <InputField
              label="Name *"
              type="text"
              icon={User}
              placeholder="Dein Vorname"
              value={registerData.name}
              onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
              error={registerErrors.name}
              autoComplete="given-name"
            />

            <InputField
              label="E-Mail *"
              type="email"
              icon={Mail}
              placeholder="name@beispiel.de"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              error={registerErrors.email}
              autoComplete="email"
            />

            <InputField
              label="Passwort *"
              type="password"
              icon={Lock}
              placeholder="Mindestens 6 Zeichen"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({ ...registerData, password: e.target.value })
              }
              error={registerErrors.password}
              autoComplete="new-password"
            />

            <InputField
              label="Stadt"
              type="text"
              icon={MapPin}
              placeholder="z.B. Berlin, München, Hamburg"
              value={registerData.city}
              onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
              autoComplete="address-level2"
            />

            {/* Gender select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-white text-sm font-medium">Geschlecht</label>
              <select
                value={registerData.gender}
                onChange={(e) =>
                  setRegisterData({ ...registerData, gender: e.target.value })
                }
                className="w-full bg-dark/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors appearance-none"
              >
                <option value="">Bitte wählen (optional)</option>
                <option value="Weiblich">Weiblich</option>
                <option value="Männlich">Männlich</option>
                <option value="Divers">Divers</option>
                <option value="Keine Angabe">Keine Angabe</option>
              </select>
            </div>

            {/* Sports multi-select */}
            <div className="flex flex-col gap-2">
              <label className="text-white text-sm font-medium">
                Meine Sportarten{' '}
                <span className="text-muted font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SPORTARTEN.map((sport) => {
                  const selected = registerData.sports.includes(sport)
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleSport(sport)}
                      className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                        selected
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-dark border-white/10 text-muted hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {sport}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-dark font-bold py-3.5 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                  Registrieren...
                </>
              ) : (
                'Kostenlos registrieren'
              )}
            </button>

            <p className="text-center text-muted text-xs leading-relaxed">
              Mit der Registrierung stimmst du unseren Nutzungsbedingungen zu.
            </p>

            <p className="text-center text-muted text-sm">
              Schon ein Konto?{' '}
              <button
                type="button"
                onClick={() => setTab('login')}
                className="text-primary hover:text-green-400 font-medium transition-colors"
              >
                Jetzt anmelden
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
