"use client";
import { useEffect, useState } from "react";
import { Bot, ShieldCheck, Ticket, Settings2, Users, ChevronRight, LockKeyhole, Sparkles } from "lucide-react";
type User = { id: string; username: string; avatar: string | null };
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user)).catch(() => {}).finally(() => setLoading(false)); }, []);
  return <main className="shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brandIcon"><Bot size={23}/></span><span>Moon<span className="accent">Bot</span></span></a>
      <div className="sideLabel">MENÜ</div>
      <a className="nav active" href="#"><ShieldCheck/> Übersicht</a>
      <a className="nav" href="#tickets"><Ticket/> Ticket-System</a>
      <a className="nav" href="#moderation"><Users/> Moderation</a>
      <a className="nav" href="#settings"><Settings2/> Einstellungen</a>
      <div className="sideFoot"><i/> MoonBot Dashboard<small>Community-Verwaltung</small></div>
    </aside>
    <section className="main">
      <header className="topbar"><div>MoonBot <span>/</span> Übersicht</div>
        {loading ? <small>Lädt …</small> : user ? <div className="userPill">{user.username}<form action="/api/auth/logout" method="post"><button>Abmelden</button></form></div> : <a className="login" href="/api/auth/discord"><LockKeyhole size={16}/> Mit Discord anmelden</a>}
      </header>
      <div className="content">
        <section className="hero"><div><div className="eyebrow"><Sparkles size={14}/> DEIN SERVER. DEINE KONTROLLE.</div><h1>Willkommen bei <b>MoonBot</b></h1><p>Verwalte deine Discord-Server zentral, einfach und übersichtlich.</p></div><div className="heroLogo"><Bot size={74}/></div></section>
        <div className="sectionHead"><div><h2>Dashboard</h2><p>Alles Wichtige auf einen Blick.</p></div><span className="status">● Dashboard bereit</span></div>
        <div className="stats">
          <article><Users/><span>Server</span><strong>—</strong><small>Server-Auswahl folgt</small></article>
          <article><Ticket/><span>Offene Tickets</span><strong>—</strong><small>Ticket-Modul folgt</small></article>
          <article><ShieldCheck/><span>Schutzstatus</span><strong className="good">Bereit</strong><small>Konfiguration folgt</small></article>
        </div>
        <div className="sectionHead"><div><h2>Bot-Verwaltung</h2><p>Die Module werden Schritt für Schritt eingerichtet.</p></div></div>
        <div className="modules">
          <a id="tickets" href="#"><Ticket/><div><h3>Ticket-System</h3><p>Support-Tickets und Team-Verwaltung.</p><em>In Entwicklung</em></div><ChevronRight/></a>
          <a id="moderation" href="#"><ShieldCheck/><div><h3>Moderation</h3><p>Moderationswerkzeuge und Protokolle.</p><em>In Entwicklung</em></div><ChevronRight/></a>
          <a id="settings" href="#"><Settings2/><div><h3>Server-Einstellungen</h3><p>Konfiguriere MoonBot für deinen Server.</p><em>In Entwicklung</em></div><ChevronRight/></a>
        </div>
        <footer>MoonBot · Dashboard · Unabhängige Community-Lösung</footer>
      </div>
    </section>
  </main>;
}