"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot, LayoutDashboard, ShieldCheck, Ticket, Settings, Bell, Search,
  ChevronDown, ChevronRight, Check, Plus, Users, MessageSquare,
  Radio, LockKeyhole, Server, LogOut, CircleHelp
} from "lucide-react";

type Guild = { id: string; name: string; icon: string | null; permissions: string; owner: boolean };
type User = { id: string; username: string; avatar: string | null; guilds: Guild[] };

const features = [
  { name: "Willkommensnachrichten", description: "Begrüße neue Mitglieder automatisch.", icon: Users, state: "In Planung" },
  { name: "Ticket-System", description: "Verwalte Support-Anfragen an einem Ort.", icon: Ticket, state: "In Planung" },
  { name: "Auto-Moderation", description: "Hilf dabei, deinen Server sauber zu halten.", icon: ShieldCheck, state: "Teilweise verfügbar" },
  { name: "Vorschläge", description: "Sammle Feedback und Ideen deiner Community.", icon: MessageSquare, state: "In Planung" },
  { name: "Social Alerts", description: "Informiere Mitglieder über neue Beiträge.", icon: Radio, state: "In Planung" },
  { name: "Server-Einstellungen", description: "Passe die Bot-Grundeinstellungen an.", icon: Settings, state: "In Planung" },
];

const iconUrl = (g: Guild) => g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64` : null;

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((result) => {
        if (result.user) {
          setUser(result.user);
          if (result.user.guilds?.length) setSelected(result.user.guilds[0].id);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const guilds = user?.guilds ?? [];
  const visibleGuilds = useMemo(
    () => guilds.filter((guild) => guild.name.toLowerCase().includes(search.toLowerCase())),
    [guilds, search]
  );
  const activeGuild = guilds.find((guild) => guild.id === selected);
  const avatar = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : null;

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark"><Bot size={22} /></span>
          <span>MoonBot</span>
        </a>
        <div className="nav-caption">MENÜ</div>
        <a className="nav-link active" href="#overview"><LayoutDashboard size={18} />Übersicht</a>
        <a className="nav-link" href="#modules"><ShieldCheck size={18} />Module</a>
        <a className="nav-link" href="#activity"><Bell size={18} />Aktivität</a>
        <div className="nav-caption nav-caption-spaced">VERWALTUNG</div>
        <a className="nav-link" href="#modules"><Ticket size={18} />Tickets</a>
        <a className="nav-link" href="#modules"><Settings size={18} />Einstellungen</a>
        <div className="sidebar-bottom">
          <div className="help-row"><CircleHelp size={17} />Hilfe & Support</div>
          <div className="sidebar-version">MoonBot Dashboard · 1.0</div>
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar">
          <div className="breadcrumb">Dashboard <ChevronRight size={14} /> Übersicht</div>
          {loading ? <span className="muted">Lädt …</span> : user ? (
            <div className="account">
              {avatar ? <img src={avatar} alt="" /> : <span className="avatar-fallback">{user.username.slice(0, 1).toUpperCase()}</span>}
              <span>{user.username}</span>
              <form action="/api/auth/logout" method="post"><button className="logout"><LogOut size={15} /> Abmelden</button></form>
            </div>
          ) : <a className="discord-login" href="/api/auth/discord"><LockKeyhole size={16} /> Mit Discord anmelden</a>}
        </header>

        <div className="content" id="overview">
          <div className="page-heading">
            <div>
              <div className="overline">MOONBOT CONTROL PANEL</div>
              <h1>Dashboard</h1>
              <p>Verwalte deinen Discord-Server an einem zentralen Ort.</p>
            </div>
            <div className="heading-mark"><Bot size={30} /></div>
          </div>

          <section className="panel server-panel">
            <div className="panel-heading">
              <div><h2>Deine Server</h2><p>Wähle den Server aus, den du verwalten möchtest.</p></div>
              {user && <span className="count-label">{guilds.length} Server</span>}
            </div>

            {!user ? (
              <div className="empty-panel">
                <div className="empty-icon"><Server size={24} /></div>
                <h3>Mit Discord verbinden</h3>
                <p>Melde dich mit Discord an, um deine Server hier anzeigen zu lassen.</p>
                <a className="primary-button" href="/api/auth/discord">Mit Discord anmelden</a>
              </div>
            ) : guilds.length === 0 ? (
              <div className="empty-panel">
                <div className="empty-icon"><Server size={24} /></div>
                <h3>Keine Server gefunden</h3>
                <p>Für deinen Account wurden keine Server mit Verwaltungsrechten gefunden.</p>
              </div>
            ) : (
              <>
                <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Server suchen …" /></label>
                <div className="server-list">
                  {visibleGuilds.map((guild) => (
                    <button key={guild.id} className={selected === guild.id ? "server-option chosen" : "server-option"} onClick={() => setSelected(guild.id)}>
                      {iconUrl(guild) ? <img src={iconUrl(guild)!} alt="" /> : <span className="server-placeholder"><Server size={19} /></span>}
                      <span className="server-name"><strong>{guild.name}</strong><small>{guild.owner ? "Serverbesitzer" : "Verwaltungsrechte"}</small></span>
                      {selected === guild.id ? <span className="chosen-indicator"><Check size={15} /></span> : <ChevronRight size={17} />}
                    </button>
                  ))}
                </div>
                {visibleGuilds.length === 0 && <p className="no-results">Kein passender Server gefunden.</p>}
              </>
            )}
          </section>

          {activeGuild && (
            <section className="modules-section" id="modules">
              <div className="active-server">
                {iconUrl(activeGuild) ? <img src={iconUrl(activeGuild)!} alt="" /> : <span className="server-placeholder"><Server size={20} /></span>}
                <div><small>AKTUELL AUSGEWÄHLT</small><strong>{activeGuild.name}</strong></div>
                <span className="selected-label">Ausgewählt <ChevronDown size={14} /></span>
              </div>
              <div className="section-heading"><div><h2>Bot-Module</h2><p>Die Funktionen von MoonBot im Überblick.</p></div><span className="count-label">{features.length} Module</span></div>
              <div className="feature-grid">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return <article className="feature-card" key={feature.name}>
                    <div className="feature-top"><span className="feature-icon"><Icon size={20} /></span><span className={feature.state === "Teilweise verfügbar" ? "state available" : "state"}>{feature.state}</span></div>
                    <h3>{feature.name}</h3><p>{feature.description}</p>
                    <div className="feature-footer"><span>Konfiguration</span><ChevronRight size={16} /></div>
                  </article>;
                })}
              </div>
            </section>
          )}

          <section className="notice" id="activity">
            <div className="notice-icon"><Bell size={19} /></div>
            <div><strong>Willkommen bei MoonBot</strong><p>Weitere Funktionen und Einstellungen werden nach und nach ergänzt.</p></div>
          </section>
          <footer>MoonBot · Discord-Verwaltung einfach gemacht</footer>
        </div>
      </section>
    </main>
  );
}
