export default function Datenschutz() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">Datenschutzerklärung</h1>
      <p className="text-muted mb-10 text-sm">Stand: April 2026</p>

      <div className="space-y-8 text-muted leading-relaxed text-sm">

        <section>
          <h2 className="text-white font-semibold text-lg mb-3">1. Verantwortlicher</h2>
          <p>
            Verantwortlich im Sinne der DSGVO ist:<br /><br />
            Mahdi Mohammadi<br />
            Volgershall 7, 21339 Lüneburg<br />
            E-Mail: sanchezmahdi1@gmail.com
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-3">2. Welche Daten wir erheben</h2>
          <p>Bei der Registrierung erheben wir folgende Daten:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Name</li>
            <li>E-Mail-Adresse</li>
            <li>Stadt (freiwillig)</li>
            <li>Geschlecht (freiwillig)</li>
            <li>Bevorzugte Sportarten (freiwillig)</li>
          </ul>
          <p className="mt-3">
            Bei der Nutzung der Plattform werden außerdem gespeichert:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Von dir erstellte oder beigetretene Sport-Sessions</li>
            <li>Nachrichten im Session-Chat</li>
            <li>Von dir hinzugefügte Sportplätze</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-3">3. Zweck der Datenverarbeitung</h2>
          <p>
            Deine Daten werden ausschließlich zur Bereitstellung der Plattform-Funktionen
            verwendet: Authentifizierung, Anzeige deines Profils für andere Nutzer,
            Teilnahme an Sessions und Nutzung des Chats. Es findet keine Weitergabe
            an Dritte oder Nutzung zu Werbezwecken statt.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-3">4. Rechtsgrundlage</h2>
          <p>
            Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO
            (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch
            Registrierung).
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-3">5. Datenspeicherung (Supabase)</h2>
          <p>
            Deine Daten werden in der EU (Frankfurt, Deutschland) auf Servern von
            Supabase Inc. gespeichert. Supabase ist DSGVO-konform und verarbeitet Daten
            ausschließlich im Auftrag gemäß einem Auftragsverarbeitungsvertrag (AVV).
            Mehr Infos: supabase.com/privacy
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-3">6. Cookies & Tracking</h2>
          <p>
            Sportis verwendet keine Tracking-Cookies und kein Analyse-Tool (z.B.
            Google Analytics). Es werden lediglich technisch notwendige Sitzungsdaten
            (Session-Token) im Browser gespeichert, die für die Anmeldung erforderlich
            sind.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-3">7. Deine Rechte</h2>
          <p>Du hast das Recht auf:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
            <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          </ul>
          <p className="mt-3">
            Um dein Konto zu löschen oder Auskunft zu erhalten, schreibe an:
            <span className="text-white"> sanchezmahdi1@gmail.com</span>
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-3">8. Beschwerderecht</h2>
          <p>
            Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu
            beschweren, insbesondere in dem EU-Mitgliedstaat deines gewöhnlichen
            Aufenthaltsorts.
          </p>
        </section>

      </div>
    </div>
  )
}
