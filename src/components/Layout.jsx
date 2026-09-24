import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import FigmaNavbar from './FigmaNavbar'
import FigmaFooter from './FigmaFooter'

export default function Layout({ children }) {
  const location = useLocation()
  const isLegacyDarkPage = location.pathname === '/dashboard'

  if (!isLegacyDarkPage) {
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
