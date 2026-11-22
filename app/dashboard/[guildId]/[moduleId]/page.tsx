"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, LoaderCircle, Save } from "lucide-react";
import AccountMenu from "@/components/AccountMenu";
import { getMoonBotModule } from "@/lib/moonbot-modules";
import type { ModuleField } from "@/lib/moonbot-modules";

type Guild = { id: string; name: string; icon: string | null; owner: boolean };
type User = { id: string; username: string; global_name: string | null; avatar: string | null; guilds: Guild[] };
type Option = { id: string; name: string; type: number };
type Resources = { channels: Option[]; roles: Option[] };

export default function ModuleSettingsPage() {
  const { guildId, moduleId } = useParams<{ guildId: string; moduleId: string }>();
  const router = useRouter();
  const module = getMoonBotModule(moduleId);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [resources, setResources] = useState<Resources>({ channels: [], roles: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const guild = user?.guilds?.find(item => item.id === guildId);
  const value = module && settings ? settings[module.settingsKey] ?? {} : {};

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }).then(response => response.json()),
      fetch("/api/bot/settings?guildId=" + encodeURIComponent(guildId), { cache: "no-store" }).then(async response => {
        const data = await response.json(); if (!response.ok) throw new Error(data.error || "Einstellungen konnten nicht geladen werden."); return data;
      }),
      fetch("/api/bot/resources?guildId=" + encodeURIComponent(guildId), { cache: "no-store" }).then(async response => {
        const data = await response.json(); return response.ok ? data : { channels: [], roles: [] };
      })
    ]).then(([userData, settingsData, resourceData]) => {
      if (!active) return;
      setUser(userData.user ?? null);
      setSettings(settingsData.settings ?? {});
      setResources({ channels: resourceData.channels ?? [], roles: resourceData.roles ?? [] });
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Daten konnten nicht geladen werden."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [guildId]);

  const setField = useCallback((key: string, next: unknown) => {
    if (!module) return;
    setSettings(current => current ? ({ ...current, [module.settingsKey]: { ...(current[module.settingsKey] ?? {}), [key]: next } }) : current);
    setNotice("");
  }, [module]);

  const save = async () => {
    if (!settings) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/bot/settings?guildId=" + encodeURIComponent(guildId), {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Speichern fehlgeschlagen.");
      setSettings(data.settings ?? settings);
      setNotice("Änderungen gespeichert");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Speichern fehlgeschlagen.");
    } finally { setSaving(false); }
  };

  const toggle = async () => {
    if (!module || !settings) return;
    const next = !value.enabled;
    const previous = value.enabled === true;
    setField("enabled", next);
    setSaving(true); setError(""); setNotice("");
    try {
      const nextSettings = { ...settings, [module.settingsKey]: { ...value, enabled: next } };
      const response = await fetch("/api/bot/settings?guildId=" + encodeURIComponent(guildId), {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: nextSettings })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Modulstatus konnte nicht gespeichert werden.");
      setSettings(data.settings ?? nextSettings);
      setNotice(next ? "Modul aktiviert" : "Modul deaktiviert");
    } catch (cause) {
      setField("enabled", previous);
      setError(cause instanceof Error ? cause.message : "Modulstatus konnte nicht gespeichert werden.");
    } finally { setSaving(false); }
  };

  const channels = useMemo(() => resources.channels.filter(item => [0, 5, 15, 16].includes(item.type)), [resources]);
  const voice = useMemo(() => resources.channels.filter(item => item.type === 2), [resources]);
  const categories = useMemo(() => resources.channels.filter(item => item.type === 4), [resources]);

  const renderField = (field: ModuleField) => {
    const current = value[field.key] ?? (field.type === "number" ? field.min ?? 0 : "");
    const options = field.type === "channel" ? channels : field.type === "voice" ? voice : field.type === "category" ? categories : field.type === "role" ? resources.roles : [];
    return <label className="discordPickerLabel" key={field.key}>
      {field.label}
      {field.type === "select" ? <select className="moduleTextInput" value={String(current)} onChange={event => setField(field.key, field.key === "threshold" ? Number(event.target.value) : event.target.value)}>{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        : field.type === "number" ? <input className="moduleTextInput" type="number" min={field.min} max={field.max} value={current} onChange={event => setField(field.key, Number(event.target.value))}/>
        : field.type === "text" ? <input className="moduleTextInput" type="text" maxLength={field.key === "message" ? 500 : 1000} placeholder={field.placeholder} value={current} onChange={event => setField(field.key, event.target.value)}/>
        : <select className="moduleTextInput" value={current} onChange={event => setField(field.key, event.target.value)}><option value="">Bitte auswählen …</option>{options.map(option => <option key={option.id} value={option.id}>{field.type === "channel" ? "#" : ""}{option.name}</option>)}</select>}
      {field.help && <small>{field.help}</small>}
    </label>;
  };

  if (!module) return <main className="dashboardShell"><a className="backLink" href={"/dashboard/" + guildId}><ArrowLeft size={15}/> Zur Modulübersicht</a><div className="moduleNotice">Dieses Modul wurde nicht gefunden.</div></main>;
  if (loading) return <main className="dashboardShell"><div className="moduleNotice">Modul wird geladen …</div></main>;
  if (!guild || !settings) return <main className="dashboardShell"><div className="moduleNotice" role="alert">{error || "Du hast keinen Zugriff auf diesen Server."}</div></main>;

  const Icon = module.icon;
  return <main className="dashboardShell">
    <header className="dashboardTop"><a className="brand" href="/"><span className="brandIcon"><img src="/moonbot-logo.svg" alt="MoonBot Logo"/></span><span>Moon<span className="accent">Bot</span></span></a><div className="dashboardTopRight"><AccountMenu userId={user!.id} username={user!.username} displayName={user!.global_name} avatar={user!.avatar}/></div></header>
    <section className="dashboardIntro"><a className="backLink" href={"/dashboard/" + guildId}><ArrowLeft size={15}/> Zur Modulübersicht</a><div className="selectedServerHero"><span className="serverAvatar">{guild.icon ? <img src={"https://cdn.discordapp.com/icons/" + guild.id + "/" + guild.icon + ".png?size=96"} alt=""/> : guild.name.slice(0,1).toUpperCase()}</span><div><div className="eyebrow">{module.group === "Sicherheit" ? "SICHERHEIT" : "BOT-MODUL"}</div><h1>{module.name}</h1><p>{module.description}</p></div></div></section>
    <section className="manageSection">
      <div className="sectionHead"><div><h2>{module.name}</h2><p>Konfiguriere dieses Modul für {guild.name}.</p></div><span className="serverCount">{module.group.toUpperCase()}</span></div>
      {error && <div className="moduleNotice" role="alert">{error}</div>}
      <article className="moduleManagePanel">
        <div className="modulePanelHeader"><span className="manageIcon"><Icon/></span><div><h2>{module.name}</h2><p>{module.description}</p></div><button className={value.enabled ? "moduleToggle on" : "moduleToggle"} onClick={toggle} disabled={saving}>{saving ? <LoaderCircle size={16}/> : value.enabled ? "Aktiv" : "Aus"}</button></div>
        <div className="moduleEditor">
          {module.id === "ticket" ? <div className="moduleNotice">Das Ticket-Modul besitzt einen eigenen erweiterten Editor.</div> : <div className="moduleFields">{module.fields.map(renderField)}</div>}
        </div>
        <div className="manageSaveRow"><p>{notice ? <span role="status"><Check size={15}/> {notice}</span> : <><b>Einstellungen</b><br/>Deine Änderungen gelten nur für {guild.name}.</>}</p><button className="heroCta" onClick={save} disabled={saving}><Save size={16}/>{saving ? "Speichert …" : "Änderungen speichern"}</button></div>
      </article>
    </section>
    <footer className="publicFooter"><b>MoonBot</b><span>Serververwaltung</span><a href="/impressum">Impressum</a></footer>
  </main>;
}
