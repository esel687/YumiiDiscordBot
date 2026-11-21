import Link from "next/link";

const p = { color: "#cbd5e1", lineHeight: 1.8 };
const h = { color: "#f8fafc", fontSize: 19, marginBottom: 10 };
const section = { marginTop: 28 };

export default function Datenschutz() {
  return <main style={{ minHeight: "100vh", background: "#080d18", color: "#f8fafc", padding: "44px 20px", fontFamily: "Arial, sans-serif" }}>
    <article style={{ maxWidth: 850, margin: "0 auto", padding: 32, background: "#101a2b", border: "1px solid #26364d", borderRadius: 18 }}>
      <Link href="/" style={{ color: "#67e8f9", textDecoration: "none" }}>← Zurück zu MoonBot</Link>
      <h1 style={{ fontSize: 34, margin: "28px 0 12px" }}>Datenschutzerklärung</h1>
      <p style={p}>Stand: 21. November 2026</p>
      <p style={{ ...p, padding: 16, border: "1px solid #b45309", borderRadius: 10, background: "#451a0333" }}><strong>Wichtiger Hinweis vor Veröffentlichung:</strong> Dies ist ein Entwurf anhand des aktuell eingesehenen Codes, keine Rechtsberatung. Betreiberangaben, Rechtsgrundlagen, Anbieter, Serverregionen, Auftragsverarbeitungsverträge und Speicherfristen müssen vom tatsächlichen Betreiber geprüft und ergänzt werden. Diese Seite ist noch nicht veröffentlichungsfertig.</p>

      <section style={section}><h2 style={h}>1. Verantwortlicher</h2>
        <p style={p}>Verantwortlich ist der tatsächliche Betreiber von MoonBot:</p>
        <p style={p}>[Vollständiger Name / rechtlich korrekte Anbieterbezeichnung]<br/>[Vollständige ladungsfähige Anschrift]<br/>E-Mail: [Kontakt-E-Mail]</p>
        <p style={p}>Keine fremden oder erfundenen Kontaktdaten einsetzen.</p>
      </section>

      <section style={section}><h2 style={h}>2. Welche Daten verarbeitet werden</h2>
        <p style={p}>Bei der Discord-Anmeldung fordert MoonBot die Berechtigungen „identify“ und „guilds“ an. Verarbeitet werden dabei insbesondere Discord-Nutzer-ID, Benutzername, Avatar sowie Server-IDs, Servernamen, Server-Icons und die Information, ob du Eigentümer eines Servers bist. Im Dashboard werden Server angezeigt, für die dein Konto Verwaltungsrechte besitzt.</p>
        <p style={p}>Nach der Anmeldung speichert MoonBot eine signierte Sitzung in einem HttpOnly-Cookie. Diese läuft nach sieben Tagen ab und enthält die für das Dashboard benötigten Discord-Konto- und Serverdaten. Ein OAuth-Sicherheitscookie wird höchstens zehn Minuten verwendet.</p>
        <p style={p}>Je nach aktivierten Bot-Funktionen verarbeitet MoonBot Discord-Server-, Kanal-, Rollen- und Mitgliedsdaten. Dazu können IDs, Kanal- und Rollennamen, Rollenfarben sowie Nachrichteninhalte und die Discord-ID von Mitgliedern gehören. Tickets erstellen private Discord-Kanäle und verwenden dafür die erforderlichen IDs und Zugriffsrechte.</p>
        <p style={p}>Servereinstellungen werden serverbezogen in einer JSON-Datei auf dem Bot-Hosting gespeichert. Sie können Modulstatus, Kanal- und Rollen-IDs sowie konfigurierte Begrüßungstexte enthalten.</p>
      </section>

      <section style={section}><h2 style={h}>3. Zwecke und Rechtsgrundlagen</h2>
        <p style={p}>Die Verarbeitung dient der Discord-Anmeldung, der Prüfung von Serverberechtigungen, der Bereitstellung der Bot-Funktionen, der Speicherung von Servereinstellungen sowie der Sicherheit und Moderation.</p>
        <p style={p}>Der Betreiber muss für jeden Vorgang die konkrete Rechtsgrundlage nach Art. 6 DSGVO festlegen und dokumentieren. Je nach Ausgestaltung können die Erbringung einer angeforderten Leistung oder berechtigte Interessen an Betrieb, Sicherheit und Moderation in Betracht kommen. Diese Zuordnung muss vor Veröffentlichung rechtlich geprüft werden.</p>
      </section>

      <section style={section}><h2 style={h}>4. KI-Auto-Mod und OpenAI</h2>
        <p style={p}>Nur wenn ein Serveradministrator den KI-Auto-Mod aktiviert und ein OpenAI-API-Schlüssel hinterlegt ist, sendet MoonBot Nachrichteninhalte zur Moderationsprüfung an die OpenAI-Moderationsschnittstelle. Laut aktuellem Code werden höchstens 4.000 Zeichen je Prüfung übermittelt. Ohne API-Schlüssel findet diese KI-Prüfung nicht statt.</p>
        <p style={p}>Bei einem erkannten Treffer kann MoonBot die Nachricht löschen und – abhängig von der Konfiguration – einen Hinweis in einem Moderationskanal veröffentlichen. Dieser Hinweis enthält unter anderem Discord-ID und -Namen des Verfassers, den Kanal und die erkannte Kategorie. Der Betreiber muss OpenAIs aktuelle Datenverarbeitung, Speicherfristen und mögliche Drittlandübermittlungen anhand seiner tatsächlichen API-Konfiguration prüfen.</p>
        <p style={p}>Die Prüfung ist eine automatisierte Moderationshilfe. Der Betreiber sollte einen Kontaktweg für Rückfragen und eine menschliche Überprüfung strittiger Moderationsentscheidungen bereitstellen und rechtlich prüfen, welche zusätzlichen Pflichten gelten.</p>
      </section>

      <section style={section}><h2 style={h}>5. Empfänger und Dienstleister</h2>
        <p style={p}>MoonBot kommuniziert für die Anmeldung mit Discord. Das Dashboard wird über Vercel bereitgestellt. Bot und Konfigurationsdaten liegen beim vom Betreiber gewählten Bot-Hosting-Anbieter. Bei aktiviertem KI-Auto-Mod wird OpenAI als Dienstleister verwendet.</p>
        <p style={p}>Vor Veröffentlichung müssen die konkreten Anbieter, Datenschutzinformationen, Serverregionen, Drittlandübermittlungen und erforderlichen Verträge zur Auftragsverarbeitung (Art. 28 DSGVO) geprüft und konkret benannt werden.</p>
      </section>

      <section style={section}><h2 style={h}>6. Cookies und Tracking</h2>
        <p style={p}>Laut aktuellem Projektcode verwendet MoonBot ein technisch notwendiges Sitzungscookie für den Discord-Login und ein kurzlebiges Cookie für den OAuth-Anmeldevorgang. Die Cookies sind HttpOnly, in Produktion Secure und verwenden SameSite=Lax. Im aktuell eingesehenen Code sind keine Analyse- oder Werbe-Cookies eingebunden. Falls später nicht notwendiges Tracking ergänzt wird, muss vor dessen Einsatz geprüft werden, ob eine Einwilligung erforderlich ist.</p>
      </section>

      <section style={section}><h2 style={h}>7. Speicherdauer und Löschung</h2>
        <p style={p}>Das Sitzungscookie läuft nach sieben Tagen ab; das OAuth-Sicherheitscookie nach zehn Minuten. Serverkonfigurationen bleiben auf dem Bot-Hosting gespeichert, bis sie ersetzt oder vom Betreiber gelöscht werden. Die Speicherfristen von Hosting- und Sicherheitsprotokollen hängen von den noch zu prüfenden Anbieter-Einstellungen ab.</p>
        <p style={p}>Der Betreiber muss konkrete Löschfristen festlegen und ein Verfahren zur Löschung nicht mehr benötigter Daten einrichten.</p>
      </section>

      <section style={section}><h2 style={h}>8. Deine Rechte</h2>
        <p style={p}>Im Rahmen der gesetzlichen Voraussetzungen hast du Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Eine Einwilligung kann mit Wirkung für die Zukunft widerrufen werden. Wende dich dazu an den oben genannten Verantwortlichen.</p>
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
