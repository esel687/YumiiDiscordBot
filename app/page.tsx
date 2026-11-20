"use client";
import { useEffect, useState } from "react";
import { Bot, ShieldCheck, Ticket, Settings2, Users, ChevronRight, LockKeyhole, Sparkles, MessageCircle, Bell, Zap, Globe, CheckCircle2, ArrowRight, HelpCircle } from "lucide-react";
type User = { id: string; username: string; avatar: string | null };
const modules = [
  { icon: Ticket, title: "Ticket-System", text: "Organisiere Support-Anfragen und behalte offene Anliegen im Blick.", status: "In Planung" },
  { icon: ShieldCheck, title: "Moderation", text: "Werkzeuge für Regeln, Moderation und ein sicheres Miteinander.", status: "In Planung" },
  { icon: Users, title: "Willkommen & Abschied", text: "Begrüße neue Mitglieder automatisch und verabschiede sie freundlich.", status: "In Planung" },
  { icon: MessageCircle, title: "Vorschläge", text: "Sammle Ideen aus deiner Community an einem zentralen Ort.", status: "In Planung" },
  { icon: Bell, title: "Benachrichtigungen", text: "Informiere deine Community über Neuigkeiten und Updates.", status: "In Planung" },
  { icon: Settings2, title: "Server-Einstellungen", text: "Passe die zukünftigen MoonBot-Funktionen an deinen Server an.", status: "In Planung" }
];
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user)).catch(() => {}).finally(() => setLoading(false)); }, []);
  return <main className="shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brandIcon"><Bot size={23}/></span><span>Moon<span className="accent">Bot</span></span></a>
      <div className="sideLabel">MENÜ</div>
      <a className="nav active" href="#home"><ShieldCheck/> Übersicht</a>
      <a className="nav" href="#features"><Zap/> Funktionen</a>
      <a className="nav" href="#modules"><Settings2/> Module</a>
      <a className="nav" href="#how"><Globe/> So funktioniert es</a>
      <a className="nav" href="#faq"><HelpCircle/> FAQ</a>
      <div className="sideFoot"><i/> MoonBot Dashboard<small>Community-Verwaltung</small></div>
    </aside>
    <section className="main">
      <header className="topbar"><div>MoonBot <span>/</span> Dashboard</div>
        {loading ? <small>Lädt …</small> : user ? <div className="userPill">{user.username}<form action="/api/auth/logout" method="post"><button>Abmelden</button></form></div> : <a className="login" href="/api/auth/discord"><LockKeyhole size={16}/> Mit Discord anmelden</a>}
      </header>
      <div className="content">
        <section className="hero" id="home"><div><div className="eyebrow"><Sparkles size={14}/> DEIN SERVER. DEINE KONTROLLE.</div><h1>Mehr Kontrolle für deinen <b>Discord-Server.</b></h1><p>MoonBot soll dir helfen, deine Community an einem Ort einfacher zu verwalten.</p><a className="heroCta" href="/api/auth/discord"><LockKeyhole size={16}/> {user ? "Mit Discord verbunden" : "Jetzt mit Discord anmelden"} <ArrowRight size={16}/></a></div><div className="heroLogo"><Bot size={74}/></div></section>

        <div className="sectionHead"><div><h2>Dein Dashboard</h2><p>Ein zentraler Überblick für deine Community.</p></div><span className="status">● Dashboard erreichbar</span></div>
        <div className="stats">
          <article><Users/><span>Deine Server</span><strong>{user ? "Verbunden" : "—"}</strong><small>{user ? "Discord-Konto angemeldet" : "Melde dich mit Discord an"}</small></article>
          <article><Settings2/><span>Geplante Module</span><strong>06</strong><small>Weitere Funktionen in Vorbereitung</small></article>
          <article><ShieldCheck/><span>MoonBot Status</span><strong className="good">Online</strong><small>Dashboard-Oberfläche erreichbar</small></article>
        </div>

        <section className="wideSection" id="features"><div className="sectionHead"><div><h2>Was MoonBot bieten soll</h2><p>Die wichtigsten Bereiche für eine gut organisierte Community.</p></div></div>
          <div className="featureGrid">
            <article><span><ShieldCheck/></span><h3>Mehr Übersicht</h3><p>Wichtige Verwaltungsbereiche an einem zentralen Ort bündeln.</p></article>
            <article><span><Zap/></span><h3>Einfache Bedienung</h3><p>Eine klare Oberfläche, damit du Einstellungen leichter findest.</p></article>
            <article><span><Users/></span><h3>Community im Fokus</h3><p>Funktionen, die den Alltag von Mitgliedern und Moderation unterstützen.</p></article>
          </div>
        </section>

        <section className="wideSection" id="modules"><div className="sectionHead"><div><h2>MoonBot Module</h2><p>Entdecke die geplanten Funktionen.</p></div><span>06 MODULE</span></div>
          <div className="modules">{modules.map((m,i)=>{const Icon=m.icon;return <article key={m.title}><Icon/><div><h3>{m.title}</h3><p>{m.text}</p><em>{m.status}</em></div><ChevronRight/></article>})}</div>
        </section>

        <section className="howSection" id="how"><div className="sectionHead"><div><h2>In drei Schritten starten</h2><p>Die Anmeldung läuft direkt über Discord.</p></div></div>
          <div className="steps"><article><b>01</b><h3>Mit Discord anmelden</h3><p>Nutze den Login-Button und bestätige die Anmeldung bei Discord.</p></article><article><b>02</b><h3>Server auswählen</h3><p>Das Dashboard kann Server anzeigen, auf denen du Verwaltungsrechte hast.</p></article><article><b>03</b><h3>MoonBot einrichten</h3><p>Die einzelnen Module werden nach und nach mit dem Bot verbunden.</p></article></div>
        </section>

        <section className="loginBanner"><div><div className="eyebrow"><LockKeyhole size={14}/> DISCORD OAUTH LOGIN</div><h2>Bereit für dein MoonBot-Dashboard?</h2><p>Melde dich sicher über Discord an. Dein Discord-Passwort wird nicht an MoonBot weitergegeben.</p></div><a className="heroCta" href="/api/auth/discord"><LockKeyhole size={16}/> {user ? "Erneut anmelden" : "Mit Discord anmelden"} <ArrowRight size={16}/></a></section>

        <section className="faqSection" id="faq"><div className="sectionHead"><div><h2>Häufige Fragen</h2><p>Ein paar Antworten rund um MoonBot.</p></div></div>
          <div className="faqGrid"><article><h3>Ist MoonBot schon vollständig fertig?</h3><p>Nein. Das Dashboard ist bereits sichtbar, die einzelnen Bot-Module werden aber noch entwickelt und verbunden.</p></article><article><h3>Wie funktioniert der Discord-Login?</h3><p>Du wirst zur offiziellen Discord-Anmeldeseite weitergeleitet und anschließend zurück zum Dashboard gebracht.</p></article><article><h3>Kann ich jeden Server verwalten?</h3><p>Im Dashboard werden Server angezeigt, für die dein Discord-Konto die nötigen Verwaltungsrechte besitzt.</p></article><article><h3>Werden Einstellungen schon gespeichert?</h3><p>Die Modul-Einstellungen sind noch nicht aktiv. Sie werden erst mit der späteren Bot-Anbindung nutzbar.</p></article></div>
        </section>
        <footer><b>MoonBot</b><span>Einfach verwalten. Gemeinsam besser.</span><a href="/impressum">Impressum</a><small>COMMUNITY DASHBOARD</small></footer>
      </div>
    </section>
  </main>;
}