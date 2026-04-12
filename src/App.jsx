import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

const Landing        = lazy(() => import('./pages/Landing'))
const Entdecken      = lazy(() => import('./pages/Entdecken'))
const SessionDetail  = lazy(() => import('./pages/SessionDetail'))
const SessionErstellen = lazy(() => import('./pages/SessionErstellen'))
const Plaetze        = lazy(() => import('./pages/Plaetze'))
const Profil         = lazy(() => import('./pages/Profil'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Login          = lazy(() => import('./pages/Login'))
const Impressum      = lazy(() => import('./pages/Impressum'))
const Datenschutz    = lazy(() => import('./pages/Datenschutz'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner />
    </div>
  )
}

function Wrap({ children }) {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E293B',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22C55E', secondary: '#0F172A' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />

        <Routes>
          <Route path="/"                element={<Wrap><Landing /></Wrap>} />
          <Route path="/entdecken"       element={<Wrap><Entdecken /></Wrap>} />
          <Route path="/session/erstellen" element={<Wrap><SessionErstellen /></Wrap>} />
          <Route path="/session/:id"     element={<Wrap><SessionDetail /></Wrap>} />
          <Route path="/plaetze"         element={<Wrap><Plaetze /></Wrap>} />
          <Route path="/profil"          element={<Wrap><Profil /></Wrap>} />
          <Route path="/dashboard"       element={<Wrap><Dashboard /></Wrap>} />
          <Route path="/login"           element={<Wrap><Login /></Wrap>} />
          <Route path="/impressum"       element={<Wrap><Impressum /></Wrap>} />
          <Route path="/datenschutz"     element={<Wrap><Datenschutz /></Wrap>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
