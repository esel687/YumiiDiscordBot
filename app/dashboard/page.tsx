"use client";

import { useEffect, useState } from "react";
import {
  Bot, ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck, Plus,
  CheckCircle2, RefreshCw
} from "lucide-react";

type Guild = { id: string; name: string; icon: string | null; owner: boolean };
type User = { username: string; guilds: Guild[] };

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
        <a className="serverCheck" href={`/dashboard/${guild.id}`}>
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
  const [botGuildsError, setBotGuildsError] = useState(false);

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
          setBotGuildsError(true);
          setInstalledIds([]);
        }
      } catch {
        if (active) {
          setBotGuildsError(true);
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

  const manageableGuilds = user.guilds ?? [];
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
          <span>{user.username}</span>
          <a className="heroCta" href="/api/bot/invite"><Plus size={14} /> Bot hinzufügen</a>
          <form action="/api/auth/logout" method="post">
            <button className="logoutButton">Abmelden</button>
          </form>
        </div>
      </header>

      <section className="dashboardIntro">
        <a className="backLink" href="/"><ArrowLeft size={15} /> Zur Startseite</a>
        <div className="eyebrow"><ShieldCheck size={14} /> DEINE COMMUNITYS</div>
        <h1>Dein Dashboard</h1>
        <p>Hier findest du getrennt alle Server, auf denen MoonBot bereits installiert ist, und Server, zu denen du ihn hinzufügen kannst.</p>
      </section>

      {botGuildsError && (
        <div className="emptyServers">
          <RefreshCw size={15} /> Der Installationsstatus konnte gerade nicht geladen werden. Bitte prüfe, ob DISCORD_TOKEN in den Vercel-Umgebungsvariablen gesetzt ist.
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
            <p>{addableGuilds.length} weitere Server, auf denen du MoonBot installieren kannst</p>
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
        <b>MoonBot</b><span>Deine Server. Deine Einstellungen.</span><a href="/impressum">Impressum</a>
      </footer>
    </main>
  );
}
