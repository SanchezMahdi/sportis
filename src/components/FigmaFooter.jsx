import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Linkedin, Mail, MapPin } from 'lucide-react'

function TikTokIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.3 6.3 0 0 0 1.86-4.46V8.77a8.28 8.28 0 0 0 4.75 1.48V6.8a4.83 4.83 0 0 1-.84-.11z" />
    </svg>
  )
}

export default function FigmaFooter() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-white border-t border-gray-100 text-gray-600 font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 pb-14 border-b border-gray-100">
          
          {/* Col 1: Logo, Slogan & PageSpeed */}
          <div className="md:col-span-5 flex flex-col items-start gap-4">
            <Link to="/" className="inline-block group">
              <span className="font-['Inter',sans-serif] text-2xl font-black tracking-tight text-gray-950 group-hover:text-[#5B3FE9] transition-colors select-none">
                Sportis
              </span>
            </Link>
            
            <div className="space-y-1">
              <p className="text-gray-900 font-bold text-base">
                Meet. Play. Connect.
              </p>
              <p className="text-sm text-gray-500">
                Find your people through sport.
              </p>
            </div>

            <div className="mt-2">
              <img 
                src="/figma/pagespeed.png" 
                alt="Google PageSpeed 100" 
                className="h-9 w-auto object-contain rounded border border-gray-200/60 shadow-2xs" 
              />
            </div>
          </div>

          {/* Col 2: Links */}
          <div className="md:col-span-3">
            <h3 className="text-gray-900 font-bold text-base mb-4">Links</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <a 
                  href="#about-us" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('about-us') }} 
                  className="hover:text-gray-900 transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <Link to="/sessions" className="hover:text-gray-900 transition-colors">
                  Sessions
                </Link>
              </li>
              <li>
                <a 
                  href="#how-it-works" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works') }} 
                  className="hover:text-gray-900 transition-colors"
                >
                  How it works
                </a>
              </li>
              <li>
                <Link to="/impressum" className="hover:text-gray-900 transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="hover:text-gray-900 transition-colors">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link to="/agb" className="hover:text-gray-900 transition-colors">
                  Nutzungsbedingungen (AGB)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact us & Social Icons */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              <h3 className="text-gray-900 font-bold text-base mb-4">Contact us</h3>
              <p className="text-sm leading-relaxed text-gray-500 mb-6 max-w-sm">
                We're here to help! Reach out, join a session, or become part of the Sportis community.
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200/80 shadow-2xs flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 fill-current" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200/80 shadow-2xs flex items-center justify-center text-gray-600 hover:text-pink-600 hover:border-pink-200 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://tiktok.com/@sportis" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200/80 shadow-2xs flex items-center justify-center text-gray-600 hover:text-black hover:border-gray-900 transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200/80 shadow-2xs flex items-center justify-center text-gray-600 hover:text-blue-700 hover:border-blue-200 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 fill-current" />
              </a>
            </div>

          </div>

        </div>

        {/* Bottom copyright line & Legal Links */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 Sportis. All rights reserved. Alle Rechte vorbehalten.</p>
          <div className="flex items-center gap-4 sm:gap-6 text-xs text-gray-500 font-medium">
            <Link to="/impressum" className="hover:text-gray-900 transition-colors">
              Impressum
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/datenschutz" className="hover:text-gray-900 transition-colors">
              Datenschutz
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/agb" className="hover:text-gray-900 transition-colors">
              AGB
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
