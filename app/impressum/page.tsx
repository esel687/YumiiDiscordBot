export default function Impressum() {
  return (
    <main style={{ minHeight: "100vh", background: "#080510", color: "#fbf4ff", padding: "48px 20px", fontFamily: "Arial, sans-serif" }}>
      <article style={{ maxWidth: 760, margin: "0 auto", padding: 32, background: "linear-gradient(145deg,#1b1028,#110b1a)", border: "1px solid #543064", borderRadius: 18, boxShadow: "0 0 28px #a855f733" }}>
        <a href="/" style={{ color: "#f0abfc", textDecoration: "none", fontSize: 14 }}>← Zurück zu MoonBot</a>
        <h1 style={{ fontSize: 34, margin: "28px 0 12px" }}>Impressum</h1>
        <p style={{ color: "#c5aaca", lineHeight: 1.7 }}>Angaben zum Anbieter und Kontakt:</p>
        <h2 style={{ fontSize: 18, marginTop: 28 }}>MoonBot</h2>
        <p style={{ lineHeight: 1.8 }}>
          Vertretungsberechtigte Person: Phillip Fräßdorf<br />
          Hugo-Heimann-Straße 1/B<br />
          12353 Berlin<br />
          Deutschland
        </p>
        <h2 style={{ fontSize: 18, marginTop: 28 }}>Kontakt</h2>
        <p style={{ lineHeight: 1.8 }}>
          E-Mail: <a href="mailto:phillip.fraessdorf@icloud.com" style={{ color: "#f0abfc" }}>phillip.fraessdorf@icloud.com</a>
        </p>
        <p style={{ color: "#bba6c9", fontSize: 13, lineHeight: 1.7, marginTop: 30 }}>
          Hinweis: Die Angaben zur Betreiber- und Vertretungsrolle müssen vor Veröffentlichung rechtlich geprüft und von der genannten Person ausdrücklich übernommen werden.
        </p>
      </article>
    </main>
  );
}
