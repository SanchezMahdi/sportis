import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import CookieBanner from './components/CookieBanner'
import FeedbackWidget from './components/FeedbackWidget'
import ProtectedRoute from './components/ProtectedRoute'

const Landing        = lazy(() => import('./pages/Landing'))
const Sessions       = lazy(() => import('./pages/Sessions'))
const Events         = lazy(() => import('./pages/Events'))
const Entdecken      = lazy(() => import('./pages/Entdecken'))
const SessionDetail  = lazy(() => import('./pages/SessionDetail'))
const SessionErstellen = lazy(() => import('./pages/SessionErstellen'))
const Profil         = lazy(() => import('./pages/Profil'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Login          = lazy(() => import('./pages/Login'))
const Impressum      = lazy(() => import('./pages/Impressum'))
const Datenschutz    = lazy(() => import('./pages/Datenschutz'))
const AGB            = lazy(() => import('./pages/AGB'))
const IPhoneApp      = lazy(() => import('./iphone/IPhoneApp'))

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

function WebFloatingOverlays() {
  const location = useLocation()
  if (location.pathname.startsWith('/app') || location.pathname.startsWith('/iphone')) {
    return null
  }
  return (
    <>
      <CookieBanner />
      <FeedbackWidget />
    </>
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

        <WebFloatingOverlays />
        <Routes>
          <Route path="/"                element={<Wrap><Landing /></Wrap>} />
          <Route path="/sessions"        element={<Wrap><Sessions /></Wrap>} />
          <Route path="/events"          element={<ProtectedRoute><Wrap><Events /></Wrap></ProtectedRoute>} />
          <Route path="/entdecken"       element={<ProtectedRoute><Wrap><Entdecken /></Wrap></ProtectedRoute>} />
          <Route path="/session/erstellen" element={<ProtectedRoute><Wrap><SessionErstellen /></Wrap></ProtectedRoute>} />
          <Route path="/session/:id"     element={<Wrap><SessionDetail /></Wrap>} />
          <Route path="/plaetze"         element={<Navigate to="/#pictures" replace />} />
          <Route path="/profil"          element={<ProtectedRoute><Wrap><Profil /></Wrap></ProtectedRoute>} />
          <Route path="/profile"         element={<Navigate to="/profil" replace />} />
          <Route path="/dashboard"       element={<ProtectedRoute><Wrap><Dashboard /></Wrap></ProtectedRoute>} />
          <Route path="/login"           element={<Wrap><Login /></Wrap>} />
          <Route path="/impressum"       element={<Wrap><Impressum /></Wrap>} />
          <Route path="/datenschutz"     element={<Wrap><Datenschutz /></Wrap>} />
          <Route path="/agb"             element={<Wrap><AGB /></Wrap>} />
          
          {/* ── iPhone Native App Experience (Figma Sportis-2.png) ── */}
          <Route path="/app"             element={<Suspense fallback={<PageLoader />}><IPhoneApp initialTab="home" /></Suspense>} />
          <Route path="/app/suche"       element={<Suspense fallback={<PageLoader />}><IPhoneApp initialTab="suche" /></Suspense>} />
          <Route path="/app/events"      element={<Suspense fallback={<PageLoader />}><IPhoneApp initialTab="events" /></Suspense>} />
          <Route path="/app/profile"     element={<Suspense fallback={<PageLoader />}><IPhoneApp initialTab="profile" /></Suspense>} />
          <Route path="/app/create"      element={<Suspense fallback={<PageLoader />}><IPhoneApp initialView="create_session" /></Suspense>} />
          <Route path="/app/login"       element={<Suspense fallback={<PageLoader />}><IPhoneApp initialView="login" /></Suspense>} />
          <Route path="/app/setup"       element={<Suspense fallback={<PageLoader />}><IPhoneApp initialView="profile_setup" /></Suspense>} />
          <Route path="/iphone"          element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
