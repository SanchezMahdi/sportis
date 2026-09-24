import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, FileText, CheckCircle2 } from 'lucide-react'

export default function AGB() {
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
            <FileText className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Rechtliche Hinweise</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight mb-3">
            Allgemeine Nutzungsbedingungen (AGB)
          </h1>
          <p className="text-sm text-gray-500">
            Stand: September 2026 • Gilt für die Plattform Sportis (sportis-app.de)
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 space-y-8 text-sm text-gray-600 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-[#2F80ED] text-xs font-bold flex items-center justify-center">1</span>
              Geltungsbereich & Vertragsgegenstand
            </h2>
            <p>
              Diese Allgemeinen Nutzungsbedingungen regeln die Nutzung der Plattform <strong>Sportis</strong> (erreichbar unter sportis-app.de). 
              Sportis bietet Nutzerinnen und Nutzern eine Vermittlungs- und Community-Plattform zur Organisation, Suche und Durchführung gemeinsamer Freizeit- und Sportaktivitäten („Sessions“).
            </p>
            <p>
              Durch die Registrierung oder Nutzung der Dienste erklärt sich der Nutzer mit diesen Bedingungen einverstanden.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-[#2F80ED] text-xs font-bold flex items-center justify-center">2</span>
              Registrierung, Benutzerkonto & Sicherheit
            </h2>
            <p>
              Die Nutzung von Interaktionsfunktionen (Erstellen von Sessions, Beitreten, Chat, Profilverwaltung) setzt die Erstellung eines Benutzerkontos voraus. Die Registrierung ist kostenlos.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen.</li>
              <li>Zugangsdaten (E-Mail und Passwort) sind vertraulich zu behandeln und vor dem Zugriff Dritter zu schützen.</li>
              <li>Ein Anspruch auf Registrierung besteht nicht.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-[#2F80ED] text-xs font-bold flex items-center justify-center">3</span>
              Organisation von Sport-Sessions & Community-Regeln
            </h2>
            <p>
              Sessions werden eigenverantwortlich von Mitgliedern der Community erstellt. Sportis stellt lediglich die technische Infrastruktur bereit.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Fairplay & Respekt:</strong> Beleidigungen, Diskriminierung, Belästigung oder unangemessenes Verhalten im Chat oder vor Ort führen zum sofortigen Ausschluss.</li>
              <li><strong>Zuverlässigkeit:</strong> Teilnehmer sollten pünktlich erscheinen oder sich rechtzeitig abmelden, um anderen Sportlern faire Spielzeiten zu ermöglichen.</li>
              <li><strong>Keine kommerziellen Angebote:</strong> Das Erstellen kommerzieller Verkaufsangebote ohne ausdrückliche Genehmigung von Sportis ist untersagt.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-[#2F80ED] text-xs font-bold flex items-center justify-center">4</span>
              Haftungsausschluss bei sportlicher Betätigung
            </h2>
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-amber-900 text-xs sm:text-sm leading-relaxed">
              <strong>Wichtiger Sicherheitshinweis:</strong> Die Teilnahme an den organisierten Sport-Sessions erfolgt stets auf eigene Gefahr und Verantwortung. 
              Sportis ist weder Veranstalter noch Aufsichtsperson der sportlichen Aktivitäten vor Ort. Für Unfälle, Verletzungen oder Sachschäden übernimmt Sportis keine Haftung, 
              es sei denn, diese beruhen auf vorsätzlichem oder grob fahrlässigem Verhalten von Sportis.
            </div>
            <p>
              Jeder Teilnehmer ist selbst dafür verantwortlich, seinen Gesundheitszustand vor der Ausübung sportlicher Aktivitäten zu prüfen und für angemessenen Versicherungsschutz (z. B. Kranken- und Haftpflichtversicherung) zu sorgen.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-[#2F80ED] text-xs font-bold flex items-center justify-center">5</span>
              Inhalte, Fotos & Urheberrechte
            </h2>
            <p>
              Lädt ein Nutzer Fotos oder Bilder (z. B. Profilbilder oder Session-Fotos) auf die Plattform hoch, gewährleistet er, die erforderlichen Urheber- und Persönlichkeitsrechte an den Inhalten zu besitzen. Das Hochladen rechtswidriger, pornografischer oder urheberrechtlich geschützter fremder Bilder ist untersagt.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-[#2F80ED] text-xs font-bold flex items-center justify-center">6</span>
              Beendigung & Kontolöschung
            </h2>
            <p>
              Nutzer können ihr Konto jederzeit kündigen oder ihre erstellten Sessions löschen. Sportis behält sich das Recht vor, Konten bei schwerwiegenden Verstößen gegen diese Nutzungsbedingungen temporär oder dauerhaft zu sperren.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-[#2F80ED] text-xs font-bold flex items-center justify-center">7</span>
              Schlussbestimmungen & Anwendbares Recht
            </h2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Sollten einzelne Bestimmungen dieser Vereinbarung unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
            <p className="pt-2">
              Fragen zu den Nutzungsbedingungen? Kontaktiere uns unter{' '}
              <a href="mailto:sanchezmahdi1@gmail.com" className="text-[#2F80ED] hover:underline font-medium">
                sanchezmahdi1@gmail.com
              </a>.
            </p>
          </section>

        </div>

      </div>
    </div>
  )
}
