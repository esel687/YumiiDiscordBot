import Link from "next/link";

export default function Impressum() {
  return <main style={{ minHeight: "100vh", background: "#080d18", color: "#f8fafc", padding: "44px 20px", fontFamily: "Arial, sans-serif" }}>
    <article style={{ maxWidth: 760, margin: "0 auto", padding: 32, background: "#101a2b", border: "1px solid #26364d", borderRadius: 18 }}>
      <Link href="/" style={{ color: "#67e8f9", textDecoration: "none" }}>← Zurück zu MoonBot</Link>
      <h1 style={{ fontSize: 34, margin: "28px 0 12px" }}>Impressum</h1>
      <p style={{ color: "#cbd5e1", lineHeight: 1.8 }}>Kontakt und Vertretung</p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Vertreter / Ansprechpartner</h2>
      <p style={{ lineHeight: 1.9, color: "#cbd5e1" }}>
        Phillip Fräßdorf<br />
        Hugo-Heimann-Straße 1/B<br />
        12353 Berlin<br />
        Deutschland
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Kontakt</h2>
      <p style={{ lineHeight: 1.9, color: "#cbd5e1" }}>
        E-Mail: <a href="mailto:phillip.fraessdorf@icloud.com" style={{ color: "#67e8f9" }}>phillip.fraessdorf@icloud.com</a>
      </p>

      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, marginTop: 30 }}>
        Phillip Fräßdorf ist als Ansprechpartner und Vertreter für MoonBot benannt. Diese Kontaktangaben allein bestimmen nicht, wer rechtlich Diensteanbieter oder datenschutzrechtlich Verantwortlicher ist. Die gesetzlich erforderlichen Angaben zum tatsächlichen Diensteanbieter sowie die Zuständigkeiten müssen entsprechend den tatsächlichen Verhältnissen ergänzt und geprüft werden.
      </p>
    </article>
  </main>;
}
