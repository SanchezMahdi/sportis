import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, Mail, EyeOff, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(false) // default in Figma is "Create your account"
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(true)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

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

    if (!isLoginMode && !acceptTerms) {
      toast.error('Bitte akzeptiere die Nutzungsbedingungen.')
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
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-['Inter',sans-serif]">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ────────────────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN: Account Form & Social Logins (Figma)                  */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#6370E9]/35">
          
          <div>
            {/* Heading & Subheading */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight mb-2">
              {isLoginMode ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              {isLoginMode ? 'Sign in to access your sessions' : 'Unlock all Features!'}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Username (only in register mode) */}
              {!isLoginMode && (
                <div className="relative">
                  <User className="w-5 h-5 text-[#818CF8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className="w-full h-12 bg-[#EEF2FF]/60 border border-[#C7D2FE]/70 rounded-xl pl-11 pr-4 text-sm text-gray-800 placeholder-[#9CA3AF] focus:outline-none focus:border-[#6384F7] focus:ring-1 focus:ring-[#6384F7] transition-colors"
                  />
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail className="w-5 h-5 text-[#818CF8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full h-12 bg-[#EEF2FF]/60 border border-[#C7D2FE]/70 rounded-xl pl-11 pr-4 text-sm text-gray-800 placeholder-[#9CA3AF] focus:outline-none focus:border-[#6384F7] focus:ring-1 focus:ring-[#6384F7] transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#818CF8] hover:text-[#4F46E5] focus:outline-none"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full h-12 bg-[#EEF2FF]/60 border border-[#C7D2FE]/70 rounded-xl pl-11 pr-4 text-sm text-gray-800 placeholder-[#9CA3AF] focus:outline-none focus:border-[#6384F7] focus:ring-1 focus:ring-[#6384F7] transition-colors"
                />
              </div>

              {/* Confirm Password (only in register mode) */}
              {!isLoginMode && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#818CF8] hover:text-[#4F46E5] focus:outline-none"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="w-full h-12 bg-[#EEF2FF]/60 border border-[#C7D2FE]/70 rounded-xl pl-11 pr-4 text-sm text-gray-800 placeholder-[#9CA3AF] focus:outline-none focus:border-[#6384F7] focus:ring-1 focus:ring-[#6384F7] transition-colors"
                  />
                </div>
              )}

              {/* Accept terms and conditions checkbox */}
              {!isLoginMode && (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#6384F7] focus:ring-[#6384F7] cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-500 cursor-pointer">
                    Accept <span className="text-[#6384F7] hover:underline">terms and conditions</span>
                  </label>
                </div>
              )}

              {/* Blue Submit Button: "LOG IN" / "SIGN UP" */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 bg-[#6E8BF7] hover:bg-[#5B7BF0] text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {loading ? 'Please wait...' : isLoginMode ? 'LOG IN' : 'SIGN UP'}
              </button>
            </form>

            {/* Switch Mode Prompt: "You have account? Login now" */}
            <div className="text-center mt-5">
              <p className="text-xs text-gray-500">
                {isLoginMode ? "Don't have an account? " : 'You have account? '}
                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="text-[#3B82F6] font-semibold hover:underline"
                >
                  {isLoginMode ? 'Register now' : 'Login now'}
                </button>
              </p>
            </div>
          </div>

          {/* Social Logins: Google, Apple, Microsoft */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-8 mt-6 border-t border-gray-100">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="inline-flex items-center gap-2 bg-white border border-gray-200/90 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded-xl shadow-2xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleOAuth('apple')}
              className="inline-flex items-center gap-2 bg-white border border-gray-200/90 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded-xl shadow-2xs transition-colors"
            >
              <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.79-11.97-14.24-6.85-10.33-12.1-22.18-15.75-35.56-3.66-13.38-5.49-25.29-5.49-35.73 0-15.22 3.8-27.46 11.41-36.72 7.61-9.26 17.1-13.99 28.46-14.19 4.14 0 9.04 1.14 14.7 3.42 5.66 2.28 9.29 3.42 10.9 3.42 1.41 0 5.23-1.22 11.45-3.65 6.22-2.44 11.49-3.48 15.82-3.13 12.08.65 21.6 4.78 28.56 12.39-10.77 6.53-16.05 15.44-15.83 26.74.22 8.92 3.59 16.2 10.11 21.85 6.52 5.66 14.13 8.81 22.83 9.46-2.18 6.53-4.8 12.83-7.85 18.91zM119.22 32.74c0-7.29 2.61-14.13 7.83-20.52 5.22-6.39 11.63-10.55 19.24-12.22.43 1.09.65 2.18.65 3.26 0 7.29-2.66 14.24-7.99 20.85-5.33 6.61-11.85 10.74-19.57 12.39-.11-1.2-.16-2.45-.16-3.76z" />
              </svg>
              <span>Sign in with Apple</span>
            </button>

            {/* Microsoft */}
            <button
              type="button"
              onClick={() => handleOAuth('azure')}
              className="inline-flex items-center gap-2 bg-white border border-gray-200/90 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded-xl shadow-2xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              <span>Sign in with Microsoft</span>
            </button>
          </div>

        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: Sports Graphic / Illustration Cluster (Figma)        */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 bg-white flex items-center justify-center relative select-none p-4 sm:p-6 lg:p-8 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src="/figma/login_sports_cluster_exact_hd.png" 
              alt="Sportis Community Sports Illustration" 
              className="w-full h-auto max-h-[640px] object-contain transition-transform hover:scale-[1.01] duration-500" 
            />
          </div>
        </div>

      </div>
    </div>
  )
}
