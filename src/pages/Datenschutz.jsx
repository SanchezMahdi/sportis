import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react'

export default function Datenschutz() {
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
            <ShieldCheck className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Datenschutz & Privatsphäre</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight mb-3">
            Datenschutzerklärung
          </h1>
          <p className="text-sm text-gray-500">
            Stand: September 2026 • DSGVO-konforme Datenschutzerklärung für sportis-app.de
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 space-y-8 text-sm text-gray-600 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-base font-bold text-gray-950">1. Verantwortliche Stelle</h2>
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
            </p>
            <p className="text-gray-800">
              Mahdi Mohammadi<br />
              Volgershall 7, 21339 Lüneburg<br />
              Deutschland<br />
              E-Mail: <a href="mailto:sanchezmahdi1@gmail.com" className="text-[#2F80ED] hover:underline">sanchezmahdi1@gmail.com</a>
            </p>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-950">2. Erhebung und Speicherung personenbezogener Daten</h2>
            <p>Beim Besuch unserer Website und bei der Nutzung unserer Dienste werden folgende Datenarten erhoben:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Registrierungsdaten:</strong> E-Mail-Adresse, Name, optional Profilbild, Wohnort/Stadt und Telefonnummer.</li>
              <li><strong>Aktivitätsdaten:</strong> Von dir erstellte Sport-Sessions, Anmeldungen / Teilnahmen an Sessions, Nachrichten im Session-Chat.</li>
              <li><strong>Server-Logfiles:</strong> IP-Adresse, Datum und Uhrzeit der Anfrage, Browsertyp und Betriebssystem (technisch notwendig zur Auslieferung der Website).</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-950">3. Zweck und Rechtsgrundlage der Verarbeitung</h2>
            <p>
              Wir verarbeiten personenbezogene Daten ausschließlich im Rahmen der gesetzlichen Vorgaben:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Vertragserfüllung & Community-Funktionen (Art. 6 Abs. 1 lit. b DSGVO):</strong> Bereitstellung des Accounts, Session-Teilnahme, Chat und Spielersuche.</li>
              <li><strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> Gewährleistung der Stabilität und Sicherheit der Web-Applikation.</li>
              <li><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Freiwillige Angaben im Profil oder optionale Push-Benachrichtigungen.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-950">4. Hosting & Datenbankinfrastruktur (Supabase & Vercel)</h2>
            <p>
              Unsere Website wird über <strong>Vercel Inc.</strong> gehostet und greift auf Datenbank- und Authentifizierungsdienste von <strong>Supabase Inc.</strong> zurück.
            </p>
            <p>
              Die Übertragung sämtlicher Daten erfolgt über eine verschlüsselte SSL-/TLS-Verbindung. Passwörter werden vor der Speicherung kryptografisch mit modernen Hashing-Algorithmen geschützt.
            </p>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-950">5. Cookies & Lokale Speicherung</h2>
            <p>
              Sportis verwendet ausschließlich technisch notwendige Cookies und den browserinternen Speicher (LocalStorage), um den Anmeldestatus und Benutzereinstellungen zu verwalten. Es werden keine Third-Party Werbe-Tracker oder Verkauf von Daten an Werbenetzwerke eingesetzt.
            </p>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-950">6. Deine Rechte als betroffene Person</h2>
            <p>Du hast jederzeit das Recht auf:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Auskunft über deine bei uns gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung deiner Daten („Recht auf Vergessenwerden“, Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            </ul>
            <p className="pt-2">
              Zur Wahrnehmung deiner Rechte wende dich bitte jederzeit an:{' '}
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
