import { Link } from 'react-router-dom'
import { ArrowRight, Users, Zap, MapPin, ChevronRight } from 'lucide-react'
import { SPORTARTEN, SPORT_EMOJIS } from '../lib/constants'

const floatingEmojis = [
  { emoji: '⚽', style: 'top-16 left-[8%] text-5xl animate-float' },
  { emoji: '🎾', style: 'top-32 right-[10%] text-4xl animate-float-delay-1' },
  { emoji: '🏀', style: 'bottom-20 left-[12%] text-5xl animate-float-delay-2' },
  { emoji: '🏐', style: 'top-1/2 right-[6%] text-4xl animate-float-delay-3' },
  { emoji: '🏸', style: 'bottom-32 right-[20%] text-3xl animate-float' },
  { emoji: '🏓', style: 'top-24 left-[30%] text-3xl animate-float-delay-2' },
]

const features = [
  {
    icon: '🏃',
    title: 'Alle Sportarten',
    desc: 'Fußball, Tennis, Basketball und 7 weitere Sportarten – für jeden etwas dabei.',
  },
  {
    icon: '👥',
    title: 'Community',
    desc: 'Triff Gleichgesinnte in deiner Stadt und erweitere deinen Sportler:innen-Kreis.',
  },
  {
    icon: '⚡',
    title: 'Echtzeit-Chat',
    desc: 'Koordiniert euch direkt in der Session – kein WhatsApp-Chaos mehr.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Profil erstellen',
    desc: 'In 30 Sekunden registrieren und deine Lieblingssportarten angeben.',
  },
  {
    number: '02',
    title: 'Session finden oder erstellen',
    desc: 'Filtere nach Sportart, Stadt, Level und Datum – oder erstelle deine eigene Session.',
  },
  {
    number: '03',
    title: 'Mitspielen!',
    desc: 'Tritt bei, chatte mit den anderen und leg los!',
  },
]

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      {/* ── Hero Section ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-2xl" />
        </div>

        {/* Floating sport emojis */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
          {floatingEmojis.map((item, i) => (
            <span
              key={i}
              className={`absolute opacity-20 ${item.style}`}
            >
              {item.emoji}
            </span>
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Zap className="w-4 h-4" />
            Die neue Sport-Community in Deutschland
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-tight tracking-tight mb-6">
            Finde dein{' '}
            <span className="text-primary relative">
              nächstes Spiel
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/40 rounded-full" />
            </span>
            .
          </h1>

          <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Sportis verbindet Sportler:innen aller Sportarten – erstelle oder finde
            Sessions in deiner Stadt. Kostenlos, einfach, sportlich.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/entdecken"
              className="inline-flex items-center justify-center gap-2 bg-primary text-dark font-bold text-lg px-8 py-4 rounded-xl hover:bg-green-400 transition-all hover:scale-105 shadow-lg shadow-primary/25"
            >
              Sessions entdecken
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/session/erstellen"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/20 text-white font-bold text-lg px-8 py-4 rounded-xl hover:border-primary hover:text-primary transition-all hover:scale-105"
            >
              Session erstellen
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-8 text-muted text-sm">
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold text-2xl">10+</span>
              <span>Sportarten</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold text-2xl">100%</span>
              <span>Kostenlos</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold text-2xl">Alle</span>
              <span>Geschlechter willkommen</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Warum <span className="text-primary">Sportis</span>?
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Alles was du brauchst, um Sport mit anderen zu genießen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-8 border border-white/5 hover:border-primary/30 transition-all group"
              >
                <div className="text-5xl mb-6">{f.icon}</div>
                <h3 className="text-white font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              So funktioniert's
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              In drei einfachen Schritten zum nächsten Spiel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />

            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-6 relative">
                  <span className="text-primary font-black text-3xl">{step.number}</span>
                  {i < steps.length - 1 && (
                    <ChevronRight className="hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 text-primary/40 w-6 h-6" />
                  )}
                </div>
                <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sports showcase ── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Deine Sportart ist dabei
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              10 Sportarten und wachsend – von Fußball bis Padel.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SPORTARTEN.map((sport) => (
              <Link
                key={sport}
                to={`/entdecken?sport=${encodeURIComponent(sport)}`}
                className="bg-card rounded-xl p-5 flex flex-col items-center gap-3 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all group hover:scale-105"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">
                  {SPORT_EMOJIS[sport]}
                </span>
                <span className="text-white text-sm font-semibold">{sport}</span>
                <span className="text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Jetzt mitspielen <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Map teaser ── */}
      <section className="py-16 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-card rounded-2xl p-8 border border-white/5">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-4">
                <MapPin className="w-4 h-4" />
                Plätze in deiner Nähe
              </div>
              <h3 className="text-white font-black text-2xl mb-3">
                Finde die besten Spielflächen
              </h3>
              <p className="text-muted mb-6 leading-relaxed">
                Unsere Community trägt Spielfelder, Hallen und Parks ein –
                filterbar nach Sportart, drinnen/draußen und kostenlos/kostenpflichtig.
              </p>
              <Link
                to="/plaetze"
                className="inline-flex items-center gap-2 bg-primary text-dark font-bold px-6 py-3 rounded-xl hover:bg-green-400 transition-colors"
              >
                Plätze entdecken
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex-1 bg-dark/50 rounded-xl h-48 flex items-center justify-center border border-white/10 w-full">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                <p className="text-muted text-sm">Karte kommt bald</p>
                <p className="text-muted/60 text-xs mt-1">OpenStreetMap Integration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-primary/20 to-green-900/10 rounded-3xl p-12 border border-primary/20 overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            </div>

            <div className="relative z-10">
              <span className="text-5xl mb-6 block">🚀</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                Bereit für dein{' '}
                <span className="text-primary">nächstes Spiel</span>?
              </h2>
              <p className="text-muted text-lg mb-8 max-w-xl mx-auto">
                Registriere dich jetzt kostenlos und werde Teil der wachsenden
                Sportis-Community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-dark font-bold text-lg px-8 py-4 rounded-xl hover:bg-green-400 transition-all hover:scale-105 shadow-lg shadow-primary/25"
                >
                  Kostenlos registrieren
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/entdecken"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/20 text-white font-bold text-lg px-8 py-4 rounded-xl hover:border-primary hover:text-primary transition-all"
                >
                  Sessions ansehen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
