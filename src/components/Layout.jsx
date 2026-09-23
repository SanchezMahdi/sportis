import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import FigmaNavbar from './FigmaNavbar'
import FigmaFooter from './FigmaFooter'

export default function Layout({ children }) {
  const location = useLocation()
  const isFigmaPage = 
    location.pathname === '/' || 
    location.pathname === '/sessions' || 
    location.pathname === '/profil' || 
    location.pathname === '/login' || 
    location.pathname === '/session/erstellen' || 
    location.pathname === '/events' || 
    location.pathname.startsWith('/session/')

  if (isFigmaPage) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-gray-900 selection:bg-[#5B3FE9]/20 selection:text-[#5B3FE9]">
        <FigmaNavbar />
        <main className="flex-1">
          {children}
        </main>
        <FigmaFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
