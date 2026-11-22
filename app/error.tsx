"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("MoonBot page error:", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#080510", color: "#fbf4ff", fontFamily: "Arial, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: 520, padding: 28, border: "1px solid #783b91", borderRadius: 18, background: "linear-gradient(145deg,#241035,#110b1a)", textAlign: "center" }}>
        <h1 style={{ margin: "0 0 12px", fontSize: 26 }}>Da ist etwas schiefgelaufen.</h1>
        <p style={{ color: "#c3adcf", lineHeight: 1.6 }}>MoonBot konnte diese Seite gerade nicht richtig laden. Du kannst es erneut versuchen oder zur Startseite zurückkehren.</p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
          <button onClick={() => reset()} style={{ padding: "11px 16px", border: "1px solid #d946ef", borderRadius: 9, background: "#641b78", color: "white", cursor: "pointer" }}>Erneut versuchen</button>
          <a href="/" style={{ padding: "11px 16px", border: "1px solid #68427c", borderRadius: 9, color: "#f0abfc", textDecoration: "none" }}>Zur Startseite</a>
        </div>
      </section>
    </main>
  );
}
