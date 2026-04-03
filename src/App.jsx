import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Entdecken from './pages/Entdecken'
import SessionDetail from './pages/SessionDetail'
import SessionErstellen from './pages/SessionErstellen'
import Plaetze from './pages/Plaetze'
import Profil from './pages/Profil'
import Login from './pages/Login'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'

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
            success: {
              iconTheme: {
                primary: '#22C55E',
                secondary: '#0F172A',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Landing />
              </Layout>
            }
          />
          <Route
            path="/entdecken"
            element={
              <Layout>
                <Entdecken />
              </Layout>
            }
          />
          <Route
            path="/session/erstellen"
            element={
              <Layout>
                <SessionErstellen />
              </Layout>
            }
          />
          <Route
            path="/session/:id"
            element={
              <Layout>
                <SessionDetail />
              </Layout>
            }
          />
          <Route
            path="/plaetze"
            element={
              <Layout>
                <Plaetze />
              </Layout>
            }
          />
          <Route
            path="/profil"
            element={
              <Layout>
                <Profil />
              </Layout>
            }
          />
          <Route
            path="/login"
            element={
              <Layout>
                <Login />
              </Layout>
            }
          />
          <Route
            path="/impressum"
            element={
              <Layout>
                <Impressum />
              </Layout>
            }
          />
          <Route
            path="/datenschutz"
            element={
              <Layout>
                <Datenschutz />
              </Layout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
