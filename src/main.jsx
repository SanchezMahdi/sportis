import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Automatic reload on dynamic chunk loading failure after new deployment
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})

window.addEventListener('error', (e) => {
  if (e?.message && (
    e.message.includes('dynamically imported module') ||
    e.message.includes('Importing a module script failed') ||
    e.message.includes('error loading dynamically imported module')
  )) {
    const lastReload = sessionStorage.getItem('last_chunk_reload')
    const now = Date.now()
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem('last_chunk_reload', String(now))
      window.location.reload()
    }
  }
})

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo)
    if (error?.message && (
      error.message.includes('dynamically imported module') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('Loading chunk')
    )) {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Aktualisierung verfügbar</h1>
          <p className="text-gray-600 mb-6 max-w-md">Die Anwendung wurde aktualisiert. Bitte lade die Seite neu, um die neueste Version zu laden.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#5B3FE9] hover:bg-[#4534C7] text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            Seite neu laden
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
