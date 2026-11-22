"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, CheckCircle2, CircleAlert, RefreshCw } from "lucide-react";

type Status = { status: "online" | "offline" | "unknown"; checkedAt?: string; message?: string };

export default function StatusPage() {
  const [data, setData] = useState<Status>({ status: "unknown" });
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  async function checkStatus() {
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      const result = await response.json();
      setData(result);
      setUpdatedAt(new Date().toLocaleTimeString("de-DE"));
    } catch {
      setData({ status: "offline" });
    } finally { setLoading(false); }
  }
  useEffect(() => {
    checkStatus();
    const timer = window.setInterval(checkStatus, 30000);
    return () => window.clearInterval(timer);
  }, []);
  const online = data.status === "online";
  const title = online ? "MoonBot ist online" : data.status === "unknown" ? "Status nicht verfügbar" : "MoonBot ist derzeit offline";
  return <main className="statusPageShell">
    <header className="statusPageHeader"><Link href="/" className="statusBack"><ArrowLeft size={16}/> Zur Startseite</Link><span>Moon<span>Bot</span></span></header>
    <section className="statusPageContent">
      <div className="statusEyebrow"><Activity size={15}/> SYSTEMSTATUS</div>
      <h1>MoonBot Status</h1>
      <p className="statusIntro">Hier siehst du, ob der MoonBot-Dienst aktuell erreichbar ist.</p>
      <article className={`statusMainCard ${online ? "isOnline" : data.status === "offline" ? "isOffline" : ""}`}>
        <div className="statusSignal">{online ? <CheckCircle2 size={30}/> : <CircleAlert size={30}/>}</div>
        <div><h2>{loading ? "Status wird geprüft …" : title}</h2><p>{data.message || (online ? "Der Bot antwortet auf die Statusabfrage." : "Die Verbindung zum Bot konnte nicht bestätigt werden.")}</p></div>
        <button onClick={checkStatus} className="statusRefresh" disabled={loading}><RefreshCw size={16}/> Aktualisieren</button>
      </article>
      <div className="statusDetails"><div><span>Dienst</span><strong>Discord-Bot</strong></div><div><span>Letzte Prüfung</span><strong>{updatedAt || "Wird geladen …"}</strong></div><div><span>Automatische Prüfung</span><strong>Alle 30 Sekunden</strong></div></div>
      <p className="statusFootnote">Die Anzeige prüft die Erreichbarkeit des Bot-Dienstes. Einzelne Discord-Funktionen können unabhängig davon eingeschränkt sein.</p>
    </section>
  </main>;
}
