import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EyeOff, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  // In Figma: default board is "Welcome Back 👋 / Sign in"
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email) {
      toast.error('Bitte gib deine E-Mail-Adresse ein.')
      return
    }

    if (!formData.password) {
      toast.error('Bitte gib dein Passwort ein.')
      return
    }

    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)

    try {
      if (isLoginMode) {
        await signIn(formData.email, formData.password)
        toast.success('Willkommen zurück!')
        navigate('/profil')
      } else {
        const result = await signUp(formData.email, formData.password, {
          name: formData.username,
        })
        if (result.session) {
          toast.success('Konto erfolgreich erstellt! Willkommen bei Sportis! 🎉')
          navigate('/profil')
        } else {
          toast.success('Konto erstellt! Bitte prüfe deine E-Mail für die Bestätigung.')
          setIsLoginMode(true)
        }
      }
    } catch (err) {
      console.error(err)
      const msg = err?.message || ''
      if (msg.includes('Invalid login')) {
        toast.error('E-Mail oder Passwort ist falsch.')
      } else if (msg.includes('already registered')) {
        toast.error('Diese E-Mail ist bereits registriert. Bitte melde dich an.')
        setIsLoginMode(true)
      } else {
        toast.error('Authentifizierung fehlgeschlagen: ' + msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error('Bitte gib zuerst deine E-Mail-Adresse ein.')
      return
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: window.location.origin + '/login',
      })
      if (error) throw error
      toast.success('Passwort-Reset-Link wurde an deine E-Mail gesendet.')
    } catch (err) {
      toast.error('Fehler beim Zurücksetzen des Passworts.')
    }
  }

  const handleOAuth = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/profil',
        },
      })
      if (error) throw error
    } catch (err) {
      toast.error(`${provider} Login derzeit nicht konfiguriert.`)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white flex items-center justify-center py-10 px-4 sm:px-6 lg:px-12 font-['Inter',sans-serif]">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        
        {/* ────────────────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN: Welcome Back Form (Figma Exact)                       */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 max-w-md w-full mx-auto flex flex-col justify-center">
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              {isLoginMode ? (
                <>Welcome Back <span className="inline-block">👋</span></>
              ) : (
                <>Create account <span className="inline-block">👋</span></>
              )}
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              {isLoginMode
                ? "Today is a new day. It's your day. You shape it."
                : 'Join Sportis and play with your community.'}
            </p>
            <p className="text-sm text-gray-600">
              {isLoginMode ? 'Log in to have fun' : 'Unlock all sports sessions'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Username / Name (only in register mode) */}
            {!isLoginMode && (
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 block">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className="w-full h-12 bg-[#F9FAFB] border border-gray-300 rounded-lg px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-colors"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                placeholder="Example@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full h-12 bg-[#F9FAFB] border border-gray-300 rounded-lg px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full h-12 bg-[#F9FAFB] border border-gray-300 rounded-lg px-4 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (only in register mode) */}
            {!isLoginMode && (
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 block">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="w-full h-12 bg-[#F9FAFB] border border-gray-300 rounded-lg px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-colors"
                />
              </div>
            )}

            {/* Forgot Password link (only in login mode) */}
            {isLoginMode && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-[#2F80ED] font-medium hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Dark Submit Button: "Log in" / "Sign up" */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 bg-[#161F2E] hover:bg-black text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLoginMode ? 'Log in' : 'Sign up'}
            </button>
          </form>

          {/* Divider: "Or" */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-xs text-gray-400 absolute">Or</span>
          </div>

          {/* Social Logins: Google & Facebook */}
          <div className="flex flex-col gap-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="w-full h-11 bg-[#F9FAFB] hover:bg-gray-100 border border-gray-200/80 rounded-lg flex items-center justify-center gap-3 text-sm font-medium text-gray-700 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Log in with Google</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleOAuth('facebook')}
              className="w-full h-11 bg-[#F9FAFB] hover:bg-gray-100 border border-gray-200/80 rounded-lg flex items-center justify-center gap-3 text-sm font-medium text-gray-700 transition-colors shadow-2xs"
            >
              <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Log in with Facebook</span>
            </button>
          </div>

          {/* Switch Mode Prompt */}
          <p className="text-center text-xs sm:text-sm text-gray-600 mt-6">
            {isLoginMode ? "Don't you have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-[#2F80ED] font-semibold hover:underline"
            >
              {isLoginMode ? 'Sign up' : 'Log in'}
            </button>
          </p>

        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: Sports Graphic / Illustration Cluster (Figma)        */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 flex items-center justify-center select-none p-4 overflow-hidden">
          <div className="relative w-full max-w-xl flex items-center justify-center">
            <img 
              src="/figma/login_sports_cluster_exact_hd.png" 
              alt="Sportis Community Sports Illustration" 
              className="w-full h-auto max-h-[600px] object-contain transition-transform hover:scale-[1.01] duration-500" 
            />
          </div>
        </div>

      </div>
    </div>
  )
}
