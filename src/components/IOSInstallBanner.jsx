import { useState, useEffect } from 'react'
import { X, Share, Plus } from 'lucide-react'

function isIOS() {
  return (
    typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !window.navigator.standalone
  )
}

function isInStandaloneMode() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
}

// open: controlled by parent (e.g. navbar push button tap)
// onClose: called when user dismisses while in controlled mode
export default function IOSInstallBanner({ open, onClose }) {
  const [show, setShow] = useState(false)

  // Controlled open
  useEffect(() => {
    if (open) setShow(true)
  }, [open])

  // Auto-show after 3s on iOS Safari (uncontrolled)
  useEffect(() => {
    if (open) return // already controlled
    const dismissed = sessionStorage.getItem('ios-banner-dismissed')
    if (!dismissed && isIOS() && !isInStandaloneMode()) {
      const t = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!show) return null

  const dismiss = () => {
    setShow(false)
    sessionStorage.setItem('ios-banner-dismissed', '1')
    if (onClose) onClose()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto bg-card border border-white/15 rounded-2xl shadow-2xl shadow-black/40 p-4">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="#000" className="w-7 h-7">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">sportis auf Home-Bildschirm</p>
            <p className="text-muted text-xs mt-0.5 leading-snug">
              Für Push-Benachrichtigungen auf iPhone: App zum Home-Bildschirm hinzufügen.
            </p>

            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted">
              <span>Tippe auf</span>
              <span className="inline-flex items-center gap-0.5 bg-white/10 rounded px-1.5 py-0.5 text-white font-medium">
                <Share className="w-3 h-3" />
                Teilen
              </span>
              <span>dann</span>
              <span className="inline-flex items-center gap-0.5 bg-white/10 rounded px-1.5 py-0.5 text-white font-medium">
                <Plus className="w-3 h-3" />
                Zum Home
              </span>
            </div>
          </div>

          <button
            onClick={dismiss}
            className="text-muted hover:text-white transition-colors p-1 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
