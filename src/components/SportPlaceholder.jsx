// Sportplatz-Bilder als Base64-encoded Daten oder externe URLs
export const SPORT_BACKGROUND_IMAGES = {
  Fußball: 'data:image/svg+xml;utf8,%3Csvg%20viewBox=%220%200%20800%20400%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3ClinearGradient%20id=%22grass%22%20x1=%220%25%22%20y1=%220%25%22%20x2=%220%25%22%20y2=%22100%25%22%3E%3Cstop%20offset=%220%25%22%20style=%22stop-color:%2334d399;stop-opacity:1%22/%3E%3Cstop%20offset=%22100%25%22%20style=%22stop-color:%2310b981;stop-opacity:1%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width=%22800%22%20height=%22400%22%20fill=%22url(%23grass)%22/%3E%3Cline%20x1=%220%22%20y1=%22200%22%20x2=%22800%22%20y2=%22200%22%20stroke=%22white%22%20stroke-width=%223%22/%3E%3Ccircle%20cx=%22400%22%20cy=%22200%22%20r=%2250%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22none%22/%3E%3Ccircle%20cx=%22400%22%20cy=%22200%22%20r=%225%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22white%22/%3E%3Crect%20x=%2250%22%20y=%22100%22%20width=%22150%22%20height=%22200%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22none%22/%3E%3Crect%20x=%22600%22%20y=%22100%22%20width=%22150%22%20height=%22200%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22none%22/%3E%3C/svg%3E',
  Basketball: 'data:image/svg+xml;utf8,%3Csvg%20viewBox=%220%200%20800%20400%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3ClinearGradient%20id=%22court%22%20x1=%220%25%22%20y1=%220%25%22%20x2=%220%25%22%20y2=%22100%25%22%3E%3Cstop%20offset=%220%25%22%20style=%22stop-color:%23f97316;stop-opacity:1%22/%3E%3Cstop%20offset=%22100%25%22%20style=%22stop-color:%23d97706;stop-opacity:1%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width=%22800%22%20height=%22400%22%20fill=%22url(%23court)%22/%3E%3Crect%20x=%2230%22%20y=%2230%22%20width=%22740%22%20height=%22340%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22none%22/%3E%3Cline%20x1=%22400%22%20y1=%2230%22%20x2=%22400%22%20y2=%22370%22%20stroke=%22white%22%20stroke-width=%223%22/%3E%3Ccircle%20cx=%22400%22%20cy=%22200%22%20r=%2260%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22none%22/%3E%3Ccircle%20cx=%22400%22%20cy=%22200%22%20r=%225%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22white%22/%3E%3Crect%20x=%2280%22%20y=%2280%22%20width=%22160%22%20height=%22240%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22none%22/%3E%3Crect%20x=%22560%22%20y=%2280%22%20width=%22160%22%20height=%22240%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22none%22/%3E%3Ccircle%20cx=%22130%22%20cy=%22200%22%20r=%2215%22%20stroke=%22white%22%20stroke-width=%222%22%20fill=%22none%22/%3E%3Ccircle%20cx=%22670%22%20cy=%22200%22%20r=%2215%22%20stroke=%22white%22%20stroke-width=%222%22%20fill=%22none%22/%3E%3C/svg%3E',
  Tennis: 'data:image/svg+xml;utf8,%3Csvg%20viewBox=%220%200%20800%20400%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3ClinearGradient%20id=%22tennisGrad%22%20x1=%220%25%22%20y1=%220%25%22%20x2=%220%25%22%20y2=%22100%25%22%3E%3Cstop%20offset=%220%25%22%20style=%22stop-color:%23eab308;stop-opacity:1%22/%3E%3Cstop%20offset=%22100%25%22%20style=%22stop-color:%23ca8a04;stop-opacity:1%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width=%22800%22%20height=%22400%22%20fill=%22url(%23tennisGrad)%22/%3E%3Crect%20x=%2250%22%20y=%2250%22%20width=%22700%22%20height=%22300%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22none%22/%3E%3Cline%20x1=%22400%22%20y1=%2250%22%20x2=%22400%22%20y2=%22350%22%20stroke=%22white%22%20stroke-width=%222%22/%3E%3Cline%20x1=%2250%22%20y1=%22200%22%20x2=%22750%22%20y2=%22200%22%20stroke=%22white%22%20stroke-width=%222%22/%3E%3Crect%20x=%22150%22%20y=%22100%22%20width=%22500%22%20height=%2280%22%20stroke=%22white%22%20stroke-width=%222%22%20fill=%22none%22/%3E%3Crect%20x=%22150%22%20y=%22220%22%20width=%22500%22%20height=%2280%22%20stroke=%22white%22%20stroke-width=%222%22%20fill=%22none%22/%3E%3Cline%20x1=%22400%22%20y1=%22100%22%20x2=%22400%22%20y2=%22300%22%20stroke=%22white%22%20stroke-width=%224%22/%3E%3C/svg%3E',
  Volleyball: 'data:image/svg+xml;utf8,%3Csvg%20viewBox=%220%200%20800%20400%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3ClinearGradient%20id=%22volleyballGrad%22%20x1=%220%25%22%20y1=%220%25%22%20x2=%220%25%22%20y2=%22100%25%22%3E%3Cstop%20offset=%220%25%22%20style=%22stop-color:%23f59e0b;stop-opacity:1%22/%3E%3Cstop%20offset=%22100%25%22%20style=%22stop-color:%23d97706;stop-opacity:1%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width=%22800%22%20height=%22400%22%20fill=%22url(%23volleyballGrad)%22/%3E%3Crect%20x=%2250%22%20y=%2250%22%20width=%22700%22%20height=%22300%22%20stroke=%22white%22%20stroke-width=%223%22%20fill=%22none%22/%3E%3Cline%20x1=%22400%22%20y1=%2250%22%20x2=%22400%22%20y2=%22350%22%20stroke=%22white%22%20stroke-width=%223%22/%3E%3Crect%20x=%2250%22%20y=%2250%22%20width=%22350%22%20height=%22300%22%20stroke=%22white%22%20stroke-width=%222%22%20fill=%22none%22/%3E%3Crect%20x=%22400%22%20y=%2250%22%20width=%22350%22%20height=%22300%22%20stroke=%22white%22%20stroke-width=%222%22%20fill=%22none%22/%3E%3Cline%20x1=%22400%22%20y1=%22130%22%20x2=%22400%22%20y2=%22270%22%20stroke=%22white%22%20stroke-width=%226%22/%3E%3C/svg%3E',
  Tischtennis: 'data:image/svg+xml;utf8,%3Csvg%20viewBox=%220%200%20800%20400%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3ClinearGradient%20id=%22tableGrad%22%20x1=%220%25%22%20y1=%220%25%22%20x2=%220%25%22%20y2=%22100%25%22%3E%3Cstop%20offset=%220%25%22%20style=%22stop-color:%23dc2626;stop-opacity:1%22/%3E%3Cstop%20offset=%22100%25%22%20style=%22stop-color:%23991b1b;stop-opacity:1%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width=%22800%22%20height=%22400%22%20fill=%22url(%23tableGrad)%22/%3E%3Crect%20x=%22100%22%20y=%2280%22%20width=%22600%22%20height=%22240%22%20stroke=%22white%22%20stroke-width=%224%22%20fill=%22none%22/%3E%3Cline%20x1=%22400%22%20y1=%2280%22%20x2=%22400%22%20y2=%22320%22%20stroke=%22white%22%20stroke-width=%222%22%20stroke-dasharray=%225,5%22/%3E%3Cline%20x1=%22400%22%20y1=%22150%22%20x2=%22400%22%20y2=%22250%22%20stroke=%22white%22%20stroke-width=%224%22/%3E%3Crect%20x=%22100%22%20y=%22160%22%20width=%22300%22%20height=%22100%22%20stroke=%22white%22%20stroke-width=%221%22%20fill=%22none%22%20opacity=%220.5%22/%3E%3Crect%20x=%22400%22%20y=%22160%22%20width=%22300%22%20height=%22100%22%20stroke=%22white%22%20stroke-width=%221%22%20fill=%22none%22%20opacity=%220.5%22/%3E%3C/svg%3E',
}

export function SoccerFieldPlaceholder() {
  return (
    <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#34d399', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#grassGradient)" />
      <line x1="0" y1="200" x2="800" y2="200" stroke="white" strokeWidth="3" />
      <circle cx="400" cy="200" r="50" stroke="white" strokeWidth="3" fill="none" />
      <circle cx="400" cy="200" r="5" stroke="white" strokeWidth="3" fill="white" />
      <rect x="50" y="100" width="150" height="200" stroke="white" strokeWidth="3" fill="none" />
      <rect x="600" y="100" width="150" height="200" stroke="white" strokeWidth="3" fill="none" />
    </svg>
  )
}

export function BasketballCourtPlaceholder() {
  return (
    <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="courtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#courtGradient)" />
      <rect x="30" y="30" width="740" height="340" stroke="white" strokeWidth="3" fill="none" />
      <line x1="400" y1="30" x2="400" y2="370" stroke="white" strokeWidth="3" />
      <circle cx="400" cy="200" r="60" stroke="white" strokeWidth="3" fill="none" />
      <circle cx="400" cy="200" r="5" stroke="white" strokeWidth="3" fill="white" />
      <rect x="80" y="80" width="160" height="240" stroke="white" strokeWidth="3" fill="none" />
      <rect x="560" y="80" width="160" height="240" stroke="white" strokeWidth="3" fill="none" />
      <circle cx="130" cy="200" r="15" stroke="white" strokeWidth="2" fill="none" />
      <circle cx="670" cy="200" r="15" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function TennisCourtPlaceholder() {
  return (
    <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="tennisGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#eab308', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#ca8a04', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#tennisGradient)" />
      <rect x="50" y="50" width="700" height="300" stroke="white" strokeWidth="3" fill="none" />
      <line x1="400" y1="50" x2="400" y2="350" stroke="white" strokeWidth="2" />
      <line x1="50" y1="200" x2="750" y2="200" stroke="white" strokeWidth="2" />
      <rect x="150" y="100" width="500" height="80" stroke="white" strokeWidth="2" fill="none" />
      <rect x="150" y="220" width="500" height="80" stroke="white" strokeWidth="2" fill="none" />
      <line x1="400" y1="100" x2="400" y2="300" stroke="white" strokeWidth="4" />
    </svg>
  )
}

export function VolleyballCourtPlaceholder() {
  return (
    <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="volleyballGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#volleyballGradient)" />
      <rect x="50" y="50" width="700" height="300" stroke="white" strokeWidth="3" fill="none" />
      <line x1="400" y1="50" x2="400" y2="350" stroke="white" strokeWidth="3" />
      <rect x="50" y="50" width="350" height="300" stroke="white" strokeWidth="2" fill="none" />
      <rect x="400" y="50" width="350" height="300" stroke="white" strokeWidth="2" fill="none" />
      <line x1="400" y1="130" x2="400" y2="270" stroke="white" strokeWidth="6" />
    </svg>
  )
}

export function PingPongPlaceholder() {
  return (
    <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="tableGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#991b1b', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#tableGradient)" />
      <rect x="100" y="80" width="600" height="240" stroke="white" strokeWidth="4" fill="none" />
      <line x1="400" y1="80" x2="400" y2="320" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
      <line x1="400" y1="150" x2="400" y2="250" stroke="white" strokeWidth="4" />
      <rect x="100" y="160" width="300" height="100" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
      <rect x="400" y="160" width="300" height="100" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
  )
}
