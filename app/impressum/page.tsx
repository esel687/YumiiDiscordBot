import Link from "next/link";

export default function Impressum() {
  return <main style={{ minHeight: "100vh", background: "#080d18", color: "#f8fafc", padding: "44px 20px", fontFamily: "Arial, sans-serif" }}>
    <article style={{ maxWidth: 760, margin: "0 auto", padding: 32, background: "#101a2b", border: "1px solid #26364d", borderRadius: 18 }}>
      <Link href="/" style={{ color: "#67e8f9", textDecoration: "none" }}>← Zurück zu MoonBot</Link>
      <h1 style={{ fontSize: 34, margin: "28px 0 12px" }}>Impressum</h1>
      <p style={{ color: "#cbd5e1", lineHeight: 1.8 }}>Anbieterkennzeichnung</p>
      <p style={{ color: "#fbbf24", lineHeight: 1.8, padding: 16, background: "#451a0333", border: "1px solid #b45309", borderRadius: 10 }}><strong>Vor Veröffentlichung ausfüllen und rechtlich prüfen lassen.</strong> Die bisherigen Anbieter- und Kontaktdaten wurden entfernt, weil sie nicht ohne bestätigte Berechtigung als Betreiberangaben veröffentlicht werden dürfen. Platzhalter sind kein vollständiges Impressum.</p>
      <h2 style={{ fontSize: 19, marginTop: 28 }}>Diensteanbieter</h2>
      <p style={{ lineHeight: 1.9, color: "#cbd5e1" }}>[Vollständiger Name / rechtlich korrekte Anbieterbezeichnung]<br/>[Vollständige ladungsfähige Anschrift]<br/>[Land]</p>
      <h2 style={{ fontSize: 19, marginTop: 28 }}>Kontakt</h2>
      <p style={{ lineHeight: 1.9, color: "#cbd5e1" }}>E-Mail: [Kontakt-E-Mail]</p>
      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, marginTop: 30 }}>Welche Angaben erforderlich sind, hängt unter anderem davon ab, wer MoonBot tatsächlich betreibt und ob der Dienst geschäftsmäßig angeboten wird. Bitte mit einem Elternteil und einer qualifizierten Beratungsstelle prüfen.</p>
    </article>
  </main>;
}
