export default function Impressum() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">Impressum</h1>
      <p className="text-muted mb-10 text-sm">Angaben gemäß § 5 TMG</p>

      <div className="space-y-8 text-muted leading-relaxed">

        <section>
          <h2 className="text-white font-semibold text-lg mb-2">Betreiber</h2>
          <p>
            Mahdi Mohammadi<br />
            Volgershall 7<br />
            21339 Lüneburg<br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-2">Kontakt</h2>
          <p>
            E-Mail: sanchezmahdi1@gmail.com
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-2">Verantwortlich für den Inhalt</h2>
          <p>
            Mahdi Mohammadi<br />
            Volgershall 7, 21339 Lüneburg
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-2">Haftungsausschluss</h2>
          <p className="text-sm">
            Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die
            Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch
            keine Gewähr übernehmen. Als Dienstanbieter sind wir gemäß § 7 Abs. 1 TMG
            für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
            verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Dienstanbieter jedoch
            nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
            überwachen.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-lg mb-2">Streitschlichtung</h2>
          <p className="text-sm">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
            (OS) bereit: https://ec.europa.eu/consumers/odr/. Wir sind nicht
            verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

      </div>
    </div>
  )
}
