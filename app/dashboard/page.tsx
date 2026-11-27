"use client";

import { useEffect, useState } from "react";
import {
  Bot, ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck, Plus,
  CheckCircle2, RefreshCw
} from "lucide-react";
import AccountMenu from "../../components/AccountMenu";

type Guild = { id: string; name: string; icon: string | null; owner: boolean };
type User = { id: string; username: string; global_name: string | null; avatar: string | null; guilds: Guild[] };

function ServerCard({ guild, installed }: { guild: Guild; installed: boolean }) {
  return (
    <article className="serverCard">
      <span className="serverAvatar">
        {guild.icon ? (
          <img
            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=96`}
            alt=""
          />
        ) : guild.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="serverInfo">
        <strong>{guild.name}</strong>
        <small>{guild.owner ? "Server-Inhaber" : "Administrator / Server verwalten"}</small>
      </span>
      {installed ? (
        <a className="serverCheck manageServerLink" href={`/dashboard/${guild.id}`}>
          Verwalten <ArrowRight size={14} />
        </a>
      ) : (
        <a className="serverCheck addServerLink" href={`/api/bot/invite?guild_id=${guild.id}`}>
          <Plus size={14} /> Hinzufügen
        </a>
      )}
    </article>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [installedIds, setInstalledIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [botGuildsError, setBotGuildsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        const [meResponse, botResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/bot/guilds", { cache: "no-store" })
        ]);
        const meData = await meResponse.json();
        if (!active) return;
        setUser(meData.user ?? null);

        if (botResponse.ok) {
          const botData = await botResponse.json();
          setInstalledIds(Array.isArray(botData.guildIds) ? botData.guildIds : []);
        } else {
          const errorData = await botResponse.json().catch(() => ({}));
          setBotGuildsError(errorData.error || `Serverfehler (${botResponse.status})`);
          setInstalledIds([]);
        }
      } catch {
        if (active) {
          setBotGuildsError("Die Verbindung zum Dashboard-Server ist fehlgeschlagen.");
          setInstalledIds([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <main className="dashboardShell"><p className="moduleNotice">Dashboard wird geladen …</p></main>;
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.replace("/");
    return (
      <main className="dashboardShell">
        <a className="brand" href="/">
          <span className="brandIcon"><Bot /></span>
          <span>Moon<span className="accent">Bot</span></span>
        </a>
        <section className="dashboardIntro">
          <h1>Bitte melde dich an</h1>
          <p>Du benötigst eine Discord-Anmeldung, um deine Server zu sehen.</p>
          <a className="heroCta" href="/api/auth/discord"><LockKeyhole size={16} /> Mit Discord anmelden</a>
        </section>
      </main>
    );
  }

  const manageableGuilds = (user.guilds ?? []).filter(guild => guild.owner === true);
  const installedSet = new Set(installedIds ?? []);
  const installedGuilds = manageableGuilds.filter(guild => installedSet.has(guild.id));
  const addableGuilds = manageableGuilds.filter(guild => !installedSet.has(guild.id));

  return (
    <main className="dashboardShell">
      <header className="dashboardTop">
        <a className="brand" href="/">
          <span className="brandIcon"><Bot /></span>
          <span>Moon<span className="accent">Bot</span></span>
        </a>
        <div className="dashboardTopRight">
          <AccountMenu userId={user.id} username={user.username} displayName={user.global_name} avatar={user.avatar} />
        </div>
      </header>

      <section className="dashboardIntro">
        <a className="backLink" href="/"><ArrowLeft size={15} /> Zur Startseite</a>
        <div className="eyebrow"><ShieldCheck size={14} /> DEINE COMMUNITYS</div>
        <h1>Dein Dashboard</h1>
        <p>Hier kannst du MoonBot ausschließlich auf Servern einstellen, deren Besitzer du bist.</p>
      </section>

      {botGuildsError && (
        <div className="emptyServers">
          <RefreshCw size={15} /> {botGuildsError}
        </div>
      )}

      <section className="dashboardServers">
        <div className="sectionHead">
          <div>
            <h2><CheckCircle2 size={18} /> MoonBot ist bereits auf dem Server</h2>
            <p>{installedGuilds.length} Server mit installiertem MoonBot</p>
          </div>
          <span className="serverCount">{installedGuilds.length} SERVER</span>
        </div>
        {installedGuilds.length ? (
          <div className="serverGrid">
            {installedGuilds.map(guild => <ServerCard key={guild.id} guild={guild} installed />)}
          </div>
        ) : (
          <div className="emptyServers">MoonBot ist noch auf keinem deiner verwaltbaren Server installiert.</div>
        )}
      </section>

      <section className="dashboardServers">
        <div className="sectionHead">
          <div>
            <h2><Plus size={18} /> MoonBot hinzufügen</h2>
            <p>{addableGuilds.length} weitere Server, deren Besitzer du bist und auf denen du MoonBot installieren kannst</p>
          </div>
          <span className="serverCount">{addableGuilds.length} SERVER</span>
        </div>
        {addableGuilds.length ? (
          <div className="serverGrid">
            {addableGuilds.map(guild => <ServerCard key={guild.id} guild={guild} installed={false} />)}
          </div>
        ) : (
          <div className="emptyServers">Alle Server, auf denen du MoonBot hinzufügen kannst, haben den Bot bereits installiert.</div>
        )}
      </section>

      <footer className="publicFooter">
        <b>MoonBot</b><span>Deine Server. Deine Einstellungen.</span><a href="/changelog">Changelog</a><a href="/impressum">Impressum</a>
      </footer>
    </main>
  );
}
