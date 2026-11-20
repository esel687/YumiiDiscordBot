"use client";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, ArrowRight, Bot, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Home, LockKeyhole, LogOut, Menu, MessageCircle, Radio, Settings, Shield, Ticket, Users, X } from "lucide-react";

type Guild={id:string;name:string;icon:string|null;permissions:string;owner:boolean};
type User={id:string;username:string;avatar:string|null;guilds:Guild[]};
type ModuleId="welcome"|"tickets"|"moderation"|"suggestions"|"social"|"security";
type PageId="overview"|ModuleId|"settings";
type Module={id:ModuleId;name:string;desc:string;group:string;status:string;icon:LucideIcon;info:string};
const modules:Module[]=[
{id:"welcome",name:"Willkommen & Abschied",desc:"Begrüße neue Mitglieder und verabschiede sie automatisch.",group:"Community",status:"Geplant",icon:Users,info:"Plane Begrüßungs- und Abschiedsnachrichten sowie die passenden Kanäle."},
{id:"tickets",name:"Ticket-System",desc:"Support-Anfragen übersichtlich organisieren.",group:"Support",status:"Geplant",icon:Ticket,info:"Plane Ticket-Kategorien, Support-Rollen und dein Ticket-Panel."},
{id:"moderation",name:"Moderation",desc:"Werkzeuge für ein faires Miteinander.",group:"Verwaltung",status:"In Entwicklung",icon:Shield,info:"Hier entstehen Moderationswerkzeuge und Protokolle."},
{id:"suggestions",name:"Vorschläge",desc:"Ideen aus deiner Community sammeln.",group:"Community",status:"Geplant",icon:MessageCircle,info:"Sammle Ideen in einem Kanal und ermögliche Abstimmungen."},
{id:"social",name:"Social Media",desc:"Informiere über neue Creator-Inhalte.",group:"Benachrichtigungen",status:"Geplant",icon:Radio,info:"Plane Hinweise zu neuen Videos und Livestreams."},
{id:"security",name:"Server-Schutz",desc:"Zusätzliche Schutzfunktionen für deinen Server.",group:"Sicherheit",status:"Geplant",icon:LockKeyhole,info:"Plane zusätzliche Regeln und Schutzfunktionen für deine Community."}
];
const guildIcon=(g:Guild)=>g.icon?`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`:null;
export default function HomePage(){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true),[selected,setSelected]=useState(""),[page,setPage]=useState<PageId>("overview"),[menu,setMenu]=useState(false);
 useEffect(()=>{fetch("/api/auth/me").then(r=>r.json()).then(d=>{if(d.user){setUser(d.user);if(d.user.guilds?.length)setSelected(d.user.guilds[0].id);}}).catch(()=>{}).finally(()=>setLoading(false));},[]);
 const guilds=user?.guilds??[],guild=guilds.find(g=>g.id===selected),mod=modules.find(m=>m.id===page),avatar=user?.avatar?`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`:null;
 const go=(p:PageId)=>{setPage(p);setMenu(false);};
 const nav=(id:PageId,label:string,Icon:LucideIcon)=><button key={id} className={page===id?"nav-item active":"nav-item"} onClick={()=>go(id)}><Icon size={18}/><span>{label}</span>{page===id&&<i/>}</button>;
 return <main className="shell">
  <aside className={menu?"sidebar open":"sidebar"}>
   <a href="/" className="brand"><span className="brand-icon"><Bot size={22}/></span><span>moonbot<small>SERVER CONTROL</small></span><button className="close-menu" onClick={()=>setMenu(false)} aria-label="Menü schließen"><X size={18}/></button></a>
   <div className="nav-label">WORKSPACE</div>{nav("overview","Übersicht",Home)}
   <div className="nav-label spaced">MODULE</div>{modules.map(m=>nav(m.id,m.name,m.icon))}
   <div className="nav-label spaced">KONTO</div>{nav("settings","Einstellungen",Settings)}
   <div className="sidebar-bottom"><div><CircleHelp size={17}/> Hilfe & Support <ArrowRight size={14}/></div><small><span/> MoonBot · Beta</small></div>
  </aside>
  {menu&&<button className="scrim" onClick={()=>setMenu(false)} aria-label="Menü schließen"/>}
  <section className="main">
   <header className="topbar"><div className="crumb-wrap"><button className="mobile-menu" onClick={()=>setMenu(true)} aria-label="Menü öffnen"><Menu size={19}/></button><div className="crumb">MoonBot <ChevronRight size={14}/><b>{page==="overview"?"Übersicht":page==="settings"?"Einstellungen":mod?.name}</b></div></div>
    <div className="top-actions"><span className="top-status"><i/> CONTROL PANEL</span>{loading?<small>Lädt …</small>:user?<div className="user-pill">{avatar?<img src={avatar} alt=""/>:<b>{user.username.slice(0,1).toUpperCase()}</b>}<span>{user.username}</span><form action="/api/auth/logout" method="post"><button aria-label="Abmelden" title="Abmelden"><LogOut size={16}/></button></form></div>:<a className="login-link" href="/api/auth/discord"><LockKeyhole size={15}/> Mit Discord anmelden</a>}</div>
   </header>
   <div className="content">
    {!user?<div className="login-layout"><div className="login-copy"><div className="eyebrow"><i/> DISCORD BOT DASHBOARD</div><h1>Dein Server.<br/><em>Dein MoonBot.</em></h1><p>Ein klarer Ort für die Verwaltung deiner Discord-Community. Melde dich mit Discord an und behalte alle Bereiche im Blick.</p><a href="/api/auth/discord" className="primary">Mit Discord fortfahren <ArrowRight size={17}/></a><div className="secure"><LockKeyhole size={14}/> Anmeldung über Discord</div></div><div className="login-art"><div className="art-caption">MOONBOT / CONTROL CENTER <span>01—06</span></div><div className="art-ring ring-a"/><div className="art-ring ring-b"/><div className="art-logo"><Bot size={65}/></div><div className="art-chip chip-a"><Shield size={15}/> Server-Verwaltung</div><div className="art-chip chip-b"><Activity size={15}/> Alles an einem Ort</div><div className="art-bottom">EINFACH · ÜBERSICHTLICH · DEIN SERVER</div></div></div>
    :guilds.length===0?<div className="empty"><Users size={28}/><h2>Keine Server verfügbar</h2><p>Dein Discord-Account hat keine Server mit Verwaltungsrechten.</p></div>
    :<>
     <div className="page-heading"><div><div className="eyebrow"><i/> MOONBOT CONTROL CENTER</div><h1>{page==="overview"?"Willkommen, "+user.username:page==="settings"?"Einstellungen":mod?.name}</h1><p>{page==="overview"?"Dein Server, deine Community – alles Wichtige an einem Ort.":page==="settings"?"Verwalte deine Konto- und Serververbindung.":mod?.info}</p></div><div className="server-select"><label htmlFor="guild-select">AKTIVER SERVER</label><div>{guild?.icon&&<img src={guildIcon(guild)!} alt=""/>}<select id="guild-select" value={selected} onChange={e=>setSelected(e.target.value)}>{guilds.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><ChevronDown size={15}/></div></div></div>
     {page==="overview"&&<>
      <div className="section-head"><div><small>SERVERÜBERSICHT</small><h2>Alles im Blick.</h2></div><span>MOONBOT DASHBOARD</span></div>
      <div className="stats"><div><span className="stat-icon"><Users size={19}/></span><small>Server mit Zugriff</small><strong>{guilds.length.toString().padStart(2,"0")}</strong><em>Deine Discord-Server</em></div><div><span className="stat-icon"><ClipboardList size={19}/></span><small>Bot-Module</small><strong>{modules.length.toString().padStart(2,"0")}</strong><em>Bereiche im Dashboard</em></div><div><span className="stat-icon"><Activity size={19}/></span><small>Dashboard</small><strong className="ready">Bereit</strong><em>Weboberfläche erreichbar</em></div></div>
      <div className="section-head modules-head"><div><small>KONFIGURATION</small><h2>Module entdecken</h2><p>Wähle einen Bereich, um mehr zu erfahren.</p></div><span>0{modules.length} BEREICHE</span></div>
      <div className="module-list">{modules.map((m,i)=>{const Icon=m.icon;return <button key={m.id} className="module-row" onClick={()=>go(m.id)}><span className="module-no">0{i+1}</span><span className="module-icon"><Icon size={20}/></span><span className="module-copy"><b>{m.name}</b><small>{m.desc}</small></span><span className={m.status==="In Entwicklung"?"tag developing":"tag"}>{m.status}</span><ArrowRight size={18} className="row-arrow"/></button>})}</div>
      <div className="note"><span>i</span><div><b>MoonBot wird weiterentwickelt</b><p>Die Oberfläche ist vorbereitet. Die Module werden schrittweise mit dem Bot verbunden. Einstellungen lassen sich aktuell noch nicht live ändern.</p></div></div>
     </>}
     {mod&&<div className="detail-grid"><section className="detail-card"><div className="detail-top"><span><mod.icon size={23}/></span><div><small>{mod.group.toUpperCase()}</small><h2>{mod.name}</h2></div></div><p>{mod.info}</p><div className="planned"><div><mod.icon size={24}/></div><small>MODULSTATUS</small><h3>Dieser Bereich wird vorbereitet.</h3><p>Hier erscheinen die Einstellungen, sobald dieses Modul vollständig mit MoonBot verbunden ist. Live-Einstellungen sind aktuell noch nicht verfügbar.</p><b>{mod.status}</b></div><button className="back" onClick={()=>go("overview")}><ArrowRight size={15}/> Zur Übersicht</button></section><aside className="detail-aside"><small>MODULINFO</small><h3>Auf einen Blick</h3><label>Bereich</label><b>{mod.group}</b><label>Status</label><b>{mod.status}</b><label>Server</label><b>{guild?.name}</b></aside></div>}
     {page==="settings"&&<section className="detail-card account-card"><div className="detail-top"><span><Settings size={23}/></span><div><small>KONTO</small><h2>Deine Verbindung</h2></div></div><div className="account-row"><div><b>Discord-Konto</b><small>Angemeldet als {user.username}</small></div><span className="connected">● Verbunden</span></div><div className="account-row"><div><b>Aktiver Server</b><small>{guild?.name??"Kein Server ausgewählt"}</small></div><span className="connected">● Ausgewählt</span></div><div className="account-row"><div><b>Abmelden</b><small>Beende deine aktuelle Sitzung.</small></div><form action="/api/auth/logout" method="post"><button className="logout-action">Abmelden <LogOut size={14}/></button></form></div></section>}
    </>}
    <footer><b>MOONBOT</b><span>Einfach verwalten. Gemeinsam besser.</span><small>VERSION BETA</small></footer>
   </div>
  </section>
 </main>;
}
