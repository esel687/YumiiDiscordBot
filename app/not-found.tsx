export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#080510", color: "#fbf4ff", fontFamily: "Arial, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: 520, padding: 28, border: "1px solid #783b91", borderRadius: 18, background: "linear-gradient(145deg,#241035,#110b1a)", textAlign: "center" }}>
        <p style={{ color: "#f0abfc", fontWeight: 700 }}>FEHLER 404</p>
        <h1 style={{ margin: "0 0 12px", fontSize: 26 }}>Diese Seite gibt es nicht.</h1>
        <p style={{ color: "#c3adcf", lineHeight: 1.6 }}>Der Link ist möglicherweise falsch oder die Seite wurde verschoben.</p>
        <a href="/" style={{ display: "inline-block", marginTop: 18, padding: "11px 16px", border: "1px solid #d946ef", borderRadius: 9, background: "#641b78", color: "white", textDecoration: "none" }}>Zur MoonBot-Startseite</a>
      </section>
    </main>
  );
}
