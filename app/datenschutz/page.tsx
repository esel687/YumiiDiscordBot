import Link from "next/link";

const p = { color: "#cbd5e1", lineHeight: 1.8 };
const h = { color: "#f8fafc", fontSize: 19, marginBottom: 10 };
const section = { marginTop: 28 };

export default function Datenschutz() {
  return <main style={{ minHeight: "100vh", background: "#080d18", color: "#f8fafc", padding: "44px 20px", fontFamily: "Arial, sans-serif" }}>
    <article style={{ maxWidth: 850, margin: "0 auto", padding: 32, background: "#101a2b", border: "1px solid #26364d", borderRadius: 18 }}>
      <Link href="/" style={{ color: "#67e8f9", textDecoration: "none" }}>← Zurück zu MoonBot</Link>
      <h1 style={{ fontSize: 34, margin: "28px 0 12px" }}>Datenschutzerklärung</h1>
      <p style={p}>Stand: 22. November 2026</p>
      <p style={{ ...p, padding: 16, border: "1px solid #b45309", borderRadius: 10, background: "#451a0333" }}><strong>Bitte vor dem öffentlichen Einsatz prüfen:</strong> Diese Erklärung ist ein technischer Entwurf auf Grundlage des derzeit eingesehenen Projektcodes und keine Rechtsberatung. Der tatsächliche Verantwortliche, die Rechtsgrundlagen, Hosting-Anbieter, Serverstandorte, Auftragsverarbeitungsverträge und konkreten Löschfristen müssen anhand des realen Betriebs bestätigt werden. Nicht zutreffende Angaben müssen angepasst werden.</p>

      <section style={section}><h2 style={h}>1. Verantwortlicher für die Datenverarbeitung</h2>
        <p style={p}>Nach den Angaben des Betreibers ist Phillip Fräßdorf Betreiber von MoonBot und für die Zwecke und Mittel der Verarbeitung personenbezogener Daten verantwortlich. Datenschutzanfragen können an folgende Kontaktadresse gerichtet werden:</p>
        <p style={p}>Betreiber von MoonBot / Verantwortlicher: Phillip Fräßdorf<br/>Hugo-Heimann-Straße 1/B<br/>12353 Berlin, Deutschland<br/>E-Mail: <a href="mailto:phillip.fraessdorf@icloud.com" style={{ color: "#67e8f9" }}>phillip.fraessdorf@icloud.com</a></p>
        <p style={p}>Diese Angabe muss den tatsächlichen Verhältnissen entsprechen: Verantwortlicher im Sinne der DSGVO ist, wer tatsächlich über Zwecke und Mittel der Verarbeitung entscheidet. Die Betreiber- und Verantwortlichenrolle sowie die Kontaktdaten sollten vor Veröffentlichung rechtlich geprüft werden.</p>
      </section>

      <section style={section}><h2 style={h}>2. Welche Daten verarbeitet werden</h2>
        <p style={p}>Bei der Discord-Anmeldung fordert MoonBot die Berechtigungen „identify“ und „guilds“ an. Verarbeitet werden dabei insbesondere Discord-Nutzer-ID, Benutzername, Avatar sowie Server-IDs, Servernamen, Server-Icons und die Information, ob du Eigentümer eines Servers bist. Im Dashboard werden Server angezeigt, für die dein Konto Verwaltungsrechte besitzt.</p>
        <p style={p}>Nach der Anmeldung speichert MoonBot eine signierte Sitzung in einem HttpOnly-Cookie. Diese läuft nach sieben Tagen ab und enthält die für das Dashboard benötigten Discord-Konto- und Serverdaten. Ein OAuth-Sicherheitscookie wird höchstens zehn Minuten verwendet.</p>
        <p style={p}>Je nach aktivierten Bot-Funktionen verarbeitet MoonBot Discord-Server-, Kanal-, Rollen- und Mitgliedsdaten. Dazu können IDs, Kanal- und Rollennamen, Rollenfarben sowie Nachrichteninhalte und Discord-IDs von Mitgliedern gehören. Das Ticketsystem erstellt private Discord-Kanäle und verwendet dafür erforderliche IDs und Zugriffsrechte.</p>
        <p style={p}>Servereinstellungen werden serverbezogen in einer JSON-Datei auf dem Bot-Hosting gespeichert. Sie können Modulstatus, Kanal- und Rollen-IDs sowie konfigurierte Begrüßungstexte enthalten.</p>
      </section>

      <section style={section}><h2 style={h}>3. Zwecke und Rechtsgrundlagen</h2>
        <p style={p}>Die Verarbeitung dient der Discord-Anmeldung, der Prüfung von Serverberechtigungen, der Bereitstellung der Bot-Funktionen, der Speicherung von Servereinstellungen sowie der Sicherheit und Moderation.</p>
        <p style={p}>Für jeden Verarbeitungsvorgang muss der tatsächliche Verantwortliche die passende Rechtsgrundlage nach Art. 6 DSGVO festlegen und dokumentieren. Je nach konkretem Einsatz können beispielsweise die Erbringung einer angeforderten Leistung oder berechtigte Interessen an Betrieb, Sicherheit und Moderation in Betracht kommen. Die konkrete Zuordnung ist vor Veröffentlichung zu prüfen.</p>
      </section>

      <section style={section}><h2 style={h}>4. KI-Auto-Mod und OpenAI</h2>
        <p style={p}>Nur wenn ein Serveradministrator den KI-Auto-Mod aktiviert und ein OpenAI-API-Schlüssel hinterlegt ist, sendet MoonBot Nachrichteninhalte zur Moderationsprüfung an die OpenAI-Moderationsschnittstelle. Laut aktuellem Code werden höchstens 4.000 Zeichen je Prüfung übermittelt. Ohne API-Schlüssel findet diese KI-Prüfung nicht statt.</p>
        <p style={p}>Bei einem erkannten Treffer kann MoonBot die Nachricht löschen und – abhängig von der Konfiguration – einen Hinweis in einem Moderationskanal veröffentlichen. Dieser Hinweis kann Discord-ID und -Namen des Verfassers, den Kanal und die erkannte Kategorie enthalten. Die tatsächliche API-Konfiguration, OpenAIs aktuelle Datenverarbeitung, Speicherfristen und mögliche Drittlandübermittlungen müssen geprüft werden.</p>
        <p style={p}>Die KI-Prüfung ist eine automatisierte Moderationshilfe. Für Rückfragen zu Moderationsentscheidungen sollte ein erreichbarer Kontaktweg und eine angemessene menschliche Prüfung vorgesehen werden.</p>
      </section>

      <section style={section}><h2 style={h}>5. Empfänger und Dienstleister</h2>
        <p style={p}>MoonBot kommuniziert für die Anmeldung mit Discord. Das Dashboard wird über Vercel bereitgestellt. Bot und Konfigurationsdaten liegen beim vom Betreiber gewählten Bot-Hosting-Anbieter. Bei aktiviertem KI-Auto-Mod wird OpenAI als Dienstleister verwendet.</p>
        <p style={p}>Vor Veröffentlichung müssen die konkret eingesetzten Anbieter, Datenschutzinformationen, Serverregionen, Drittlandübermittlungen und erforderlichen Verträge zur Auftragsverarbeitung nach Art. 28 DSGVO geprüft und konkret benannt werden.</p>
      </section>

      <section style={section}><h2 style={h}>6. Cookies und Tracking</h2>
        <p style={p}>Laut aktuell eingesehenem Projektcode verwendet MoonBot ein technisch notwendiges Sitzungscookie für den Discord-Login und ein kurzlebiges Cookie für den OAuth-Anmeldevorgang. Die Cookies sind HttpOnly, in Produktion Secure und verwenden SameSite=Lax. Im eingesehenen Code sind keine Analyse- oder Werbe-Cookies eingebunden. Falls später weitere Technologien ergänzt werden, muss vor ihrem Einsatz geprüft werden, ob eine Einwilligung erforderlich ist.</p>
      </section>

      <section style={section}><h2 style={h}>7. Speicherdauer und Löschung</h2>
        <p style={p}>Das Sitzungscookie läuft nach sieben Tagen ab; das OAuth-Sicherheitscookie nach zehn Minuten. Serverkonfigurationen bleiben auf dem Bot-Hosting gespeichert, bis sie ersetzt oder vom Betreiber gelöscht werden. Die Speicherfristen von Hosting- und Sicherheitsprotokollen richten sich nach den noch zu prüfenden Anbieter-Einstellungen.</p>
        <p style={p}>Der tatsächliche Verantwortliche muss konkrete Löschfristen festlegen und ein Verfahren zur Löschung nicht mehr benötigter Daten einrichten.</p>
      </section>

      <section style={section}><h2 style={h}>8. Deine Datenschutzrechte</h2>
        <p style={p}>Im Rahmen der gesetzlichen Voraussetzungen hast du Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Eine Einwilligung kann mit Wirkung für die Zukunft widerrufen werden. Wende dich für Datenschutzanfragen an den oben genannten Kontakt.</p>
        <p style={p}>Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, insbesondere am Ort deines gewöhnlichen Aufenthalts, Arbeitsplatzes oder des mutmaßlichen Verstoßes.</p>
      </section>

      <section style={section}><h2 style={h}>9. Erforderliche Daten</h2>
        <p style={p}>Ohne die erforderlichen Discord-Berechtigungen kann MoonBot bestimmte Server nicht anzeigen oder verwalten. Die für ausgewählte Bot-Funktionen erforderlichen Daten sind notwendig, um diese Funktionen bereitzustellen.</p>
      </section>

      <section style={section}><h2 style={h}>10. Änderungen</h2>
        <p style={p}>Diese Erklärung muss aktualisiert werden, wenn sich Funktionen, Dienstleister, Datenverarbeitungen oder Speicherfristen ändern.</p>
      </section>
    </article>
  </main>;
}
