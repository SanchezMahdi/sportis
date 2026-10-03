import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function IPhoneLogin({ onSuccess, onNavigateSetup }) {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Bitte E-Mail und Passwort eingeben')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password, { name: email.split('@')[0] })
        toast.success('Konto erstellt! Bitte Profil vervollständigen.')
        if (onNavigateSetup) onNavigateSetup()
      } else {
        await signIn(email, password)
        toast.success('Erfolgreich angemeldet! 👋')
        if (onSuccess) onSuccess()
      }
    } catch (err) {
      toast.error(err.message || 'Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    toast.success('Als Demo-Nutzer angemeldet! ⚽')
    if (onSuccess) onSuccess()
  }

  return (
    <div className="min-h-screen bg-white px-6 py-6 flex flex-col justify-between font-['Inter',sans-serif] text-gray-900">
      
      <div className="space-y-6">
        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 1. Sports Illustration Cluster (Figma Exact)                       */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="w-full flex items-center justify-center pt-2 pb-1">
          <img
            src="/iphone/sports_cluster.png"
            alt="Sportis Athletes"
            className="h-44 sm:h-52 w-auto object-contain"
          />
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 2. Welcome to Sportis Heading                                      */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">
            {isSignUp ? 'Join Sportis' : 'Welcome to Sportis'}
          </h1>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 3. Auth Form Inputs                                                */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-gray-800">
              Email
            </label>
            <input
              type="email"
              placeholder="Example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-200/80 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5B3FE9] focus:bg-white transition-all"
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-gray-800">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-200/80 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5B3FE9] focus:bg-white transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isSignUp && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => toast('Passwort-Reset-Link wurde verschickt.')}
                className="text-xs font-semibold text-[#2F80ED] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Sign in Button (Navy / Dark `#192B37`) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#192B37] hover:bg-[#111C24] active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Laden...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>

        </form>

        {/* Divider: Or */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-gray-200 w-full" />
          <span className="bg-white px-3 text-xs font-medium text-gray-400">
            Or
          </span>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200/70 rounded-2xl text-xs font-bold text-gray-800 transition-colors flex items-center justify-center gap-3 shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200/70 rounded-2xl text-xs font-bold text-gray-800 transition-colors flex items-center justify-center gap-3 shadow-2xs"
          >
            <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Sign in with Facebook</span>
          </button>
        </div>
      </div>

      {/* Toggle Sign in / Sign up Mode */}
      <div className="pt-6 pb-2 text-center text-xs text-gray-600">
        <span>
          {isSignUp ? 'Bereits ein Konto? ' : "Don't you have an account? "}
        </span>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="font-bold text-[#2F80ED] hover:underline ml-1"
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </div>

    </div>
  )
}
