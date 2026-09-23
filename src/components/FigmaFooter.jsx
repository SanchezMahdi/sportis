import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Linkedin, Mail, MapPin } from 'lucide-react'

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
              <img 
                src="/figma/nav_logo.png" 
                alt="Sportis Logo" 
                className="w-8 h-8 object-contain" 
              />
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
                  Services
                </Link>
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
                <Link to="/entdecken" className="hover:text-gray-900 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact us & Social Icons */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              <h3 className="text-gray-900 font-bold text-base mb-4">Contact us</h3>
              <p className="text-sm leading-relaxed text-gray-500 mb-4 max-w-sm">
                We're here to help! Reach out, join a session, or become part of the Sportis community.
              </p>
              <p className="text-sm font-semibold text-gray-800 mb-6">
                +923183561921
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
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200/80 shadow-2xs flex items-center justify-center text-gray-600 hover:text-sky-500 hover:border-sky-200 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 fill-current" />
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

        {/* Bottom copyright line: centered IK Developers */}
        <div className="pt-8 text-center text-xs text-gray-400">
          <p>© 2023 Copyright by IK Developers. All rights reserved.</p>
        </div>

      </div>
    </footer>
  )
}
