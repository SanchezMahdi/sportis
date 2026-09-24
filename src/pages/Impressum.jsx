import { Link } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'

export default function Impressum() {
  return (
    <div className="min-h-screen bg-[#FDFDFE] text-gray-900 font-['Inter',sans-serif] py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Zurück zur Startseite</span>
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 mb-8">
          <div className="flex items-center gap-3 text-[#2F80ED] mb-3">
            <Building2 className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Rechtliche Angaben</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight mb-3">
            Impressum
          </h1>
          <p className="text-sm text-gray-500">
            Angaben gemäß § 5 TMG • Sportis Plattform (sportis-app.de)
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 space-y-8 text-sm text-gray-600 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-gray-950">Diensteanbieter & Betreiber</h2>
            <p className="text-gray-800">
              Mahdi Mohammadi<br />
              Volgershall 7<br />
              21339 Lüneburg<br />
              Deutschland
            </p>
          </section>

          <section className="space-y-2 border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-950">Kontakt</h2>
            <p>
              E-Mail:{' '}
              <a href="mailto:sanchezmahdi1@gmail.com" className="text-[#2F80ED] hover:underline font-medium">
                sanchezmahdi1@gmail.com
              </a>
            </p>
          </section>

          <section className="space-y-2 border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-950">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p className="text-gray-800">
              Mahdi Mohammadi<br />
              Volgershall 7<br />
              21339 Lüneburg
            </p>
          </section>

          <section className="space-y-2 border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-950">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          <section className="space-y-2 border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-950">Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </section>

          <section className="space-y-2 border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-950">Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer" className="text-[#2F80ED] hover:underline">
                https://ec.europa.eu/consumers/odr/
              </a>.
            </p>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

        </div>

      </div>
    </div>
  )
}
