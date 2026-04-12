import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-card border border-white/20 rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-white text-sm font-semibold mb-1">🍪 Cookies & Datenschutz</p>
          <p className="text-muted text-xs leading-relaxed">
            Wir verwenden technisch notwendige Cookies für die Authentifizierung.
            Keine Tracking-Cookies ohne deine Zustimmung.{' '}
            <a href="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</a>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-muted hover:text-white border border-white/10 rounded-xl transition-colors"
          >
            Ablehnen
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-bold bg-primary text-dark rounded-xl hover:bg-green-400 transition-colors"
          >
            Akzeptieren
          </button>
        </div>
        <button onClick={decline} className="absolute top-3 right-3 text-muted hover:text-white sm:hidden">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
