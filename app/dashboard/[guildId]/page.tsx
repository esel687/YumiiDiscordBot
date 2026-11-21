"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, ArrowLeft, Ticket, Bell, UserPlus, Users, ShieldCheck, Save, Hash, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";

type Guild={id:string;name:string;icon:string|null;owner:boolean};
type User={username:string;guilds:Guild[]};
type DiscordChannel={id:string;name:string;type:number;parentId:string;position:number};
type DiscordRole={id:string;name:string;color:string;position:number};
type Resources={channels:DiscordChannel[];roles:DiscordRole[]};
const modules=[
  {key:"tickets",name:"Ticketsystem",icon:Ticket,desc:"Private Support-Kanäle für deine Community."},
  {key:"welcome",name:"Willkommensnachrichten",icon:Bell,desc:"Begrüße neue Mitglieder automatisch."},
  {key:"autorole",name:"Auto Role",icon:UserPlus,desc:"Weise neuen Mitgliedern automatisch eine Rolle zu."},
  {key:"selfroles",name:"Self Roles",icon:Users,desc:"Mitglieder können ihre Rollen selbst auswählen."},
  {key:"automod",name:"KI-Auto-Mod",icon:ShieldCheck,desc:"Unterstützt die Moderation beim Erkennen problematischer Nachrichten."}
];
function ChannelPicker({label,value,channels,emptyLabel,onChange}:{label:string;value:string;channels:DiscordChannel[];emptyLabel:string;onChange:(id:string)=>void}){
  return <label className="discordPickerLabel">{label}<span className="discordPicker"><Hash size={15}/><select value={value||""} onChange={e=>onChange(e.target.value)}><option value="">{emptyLabel}</option>{channels.map(channel=><option key={channel.id} value={channel.id}>#{channel.name}</option>)}</select><ChevronDown size={15}/></span></label>;
}
function RolePicker({label,value,roles,onChange,placeholder}:{label:string;value:string;roles:DiscordRole[];onChange:(id:string)=>void;placeholder:string}){
  return <label className="discordPickerLabel">{label}<span className="discordPicker rolePicker"><ShieldCheck size={15}/><select value={value||""} onChange={e=>onChange(e.target.value)}><option value="">{placeholder}</option>{roles.map(role=><option key={role.id} value={role.id}>{role.name}</option>)}</select><ChevronDown size={15}/></span></label>;
}
export default function ServerManagement(){
 const params=useParams<{guildId:string}>(); const guildId=params.guildId;
 const [user,setUser]=useState<User|null>(null); const [settings,setSettings]=useState<any>(null);
 const [resources,setResources]=useState<Resources|null>(null); const [error,setError]=useState(""); const [resourceError,setResourceError]=useState("");
 const [saving,setSaving]=useState(false); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [activeModule,setActiveModule]=useState<string|null>(null);
 const guild=user?.guilds?.find(g=>g.id===guildId);
 const textChannels=useMemo(()=>resources?.channels.filter(c=>[0,5,15,16].includes(c.type))??[],[resources]);
 const categories=useMemo(()=>resources?.channels.filter(c=>c.type===4)??[],[resources]);
 const roles=resources?.roles??[];
 useEffect(()=>{fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json()).then(d=>setUser(d.user??null)).catch(()=>setError("Sitzung konnte nicht geladen werden.")).finally(()=>setLoading(false));},[]);
 useEffect(()=>{if(!guildId||!user)return;fetch("/api/bot/settings?guildId="+encodeURIComponent(guildId),{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Einstellungen konnten nicht geladen werden.");setSettings(d.settings);}).catch(e=>setError(e.message));},[guildId,user]);
 const loadResources=async()=>{if(!guildId)return;setRefreshing(true);setResourceError("");try{const r=await fetch("/api/bot/resources?guildId="+encodeURIComponent(guildId),{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Serverdaten konnten nicht geladen werden.");setResources(d);}catch(e:any){setResourceError(e.message||"Serverdaten konnten nicht geladen werden.");}finally{setRefreshing(false);}};
 useEffect(()=>{if(user&&guildId)loadResources();},[user,guildId]);
 const update=(key:string,patch:any)=>setSettings((s:any)=>({...s,[key]:{...s[key],...patch}}));
 const save=async()=>{if(!settings)return;setSaving(true);setError("");try{const r=await fetch("/api/bot/settings?guildId="+encodeURIComponent(guildId),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({settings})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Speichern fehlgeschlagen.");setSettings(d.settings);}catch(e:any){setError(e.message||"Speichern fehlgeschlagen.");}finally{setSaving(false);}};
 if(loading)return <main className="dashboardShell"><p className="moduleNotice">Server wird geladen …</p></main>;
 if(!user||!guild)return <main className="dashboardShell"><a className="backLink" href="/dashboard"><ArrowLeft size={15}/> Zur Serverübersicht</a><section className="emptyServers">Dieser Server ist nicht in deiner Sitzung enthalten oder du hast keine Verwaltungsrechte. <a href="/api/auth/discord">Erneut mit Discord anmelden</a>.</section></main>;
 return <main className="dashboardShell">
  <header className="dashboardTop"><a className="brand" href="/"><span className="brandIcon"><Bot/></span><span>Moon<span className="accent">Bot</span></span></a><div className="dashboardTopRight"><span>{user.username}</span><form action="/api/auth/logout" method="post"><button className="logoutButton">Abmelden</button></form></div></header>
  <section className="dashboardIntro"><a className="backLink" href="/dashboard"><ArrowLeft size={15}/> Alle Server</a><div className="selectedServerHero"><span className="serverAvatar">{guild.icon?<img src={"https://cdn.discordapp.com/icons/"+guild.id+"/"+guild.icon+".png?size=96"} alt=""/>:guild.name.slice(0,1).toUpperCase()}</span><div><div className="eyebrow">SERVERVERWALTUNG</div><h1>{guild.name}</h1><p>Wähle Kanäle und Rollen direkt aus deinem Discord-Server aus.</p></div></div></section>
  <section className="manageSection">
   <div className="sectionHead"><div><h2>Bot-Module</h2><p>Alle Einstellungen gelten nur für {guild.name}.</p></div><span className="serverCount">5 MODULE</span></div>
   {error&&<div className="moduleNotice" role="alert">{error}</div>}
   {resourceError&&<div className="moduleNotice resourceNotice"><div>{resourceError}</div><button onClick={loadResources} disabled={refreshing}><RefreshCw size={14}/> Erneut laden</button><small>MoonBot muss online sein und Zugriff auf die Serverkanäle und Rollen haben.</small></div>}
   {!resources&&!resourceError&&<div className="moduleNotice">Lade Kanäle und Rollen von Discord …</div>}
   {!settings&&!error&&<div className="moduleNotice">Lade Servereinstellungen …</div>}
   {settings&&modules.map(m=>{const Icon=m.icon;const value=settings[m.key]??{};return <article className="manageModule" key={m.key}>
    <div className="manageModuleHead moduleClickableHead" role="button" tabIndex={0} aria-expanded={activeModule===m.key} onClick={()=>setActiveModule(activeModule===m.key?null:m.key)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setActiveModule(activeModule===m.key?null:m.key);}}}><span className="manageIcon"><Icon/></span><div><h3>{m.name}</h3><p>{m.desc}</p></div><span className="moduleManageLabel">{activeModule===m.key?"Schließen":"Verwalten"} <ChevronRight size={15}/></span><button className={value.enabled?"moduleToggle on":"moduleToggle"} onClick={e=>{e.stopPropagation();update(m.key,{enabled:!value.enabled});}}>{value.enabled?"Aktiv":"Aus"}</button></div>
    {activeModule===m.key&&<div className="moduleEditor"><div className="moduleEditorTitle"><strong>{m.name} verwalten</strong><span>Hier kannst du die Einstellungen für diesen Server bearbeiten.</span></div>
    {m.key==="tickets"&&<div className="moduleFields">
      <ChannelPicker label="Ticket-Kategorie" value={value.categoryId} channels={categories} emptyLabel="Kategorie auswählen …" onChange={id=>update(m.key,{categoryId:id})}/>
      <RolePicker label="Support-Rolle" value={value.supportRoleId} roles={roles} placeholder="Rolle auswählen …" onChange={id=>update(m.key,{supportRoleId:id})}/>
      <ChannelPicker label="Ticket-Panel-Kanal" value={value.panelChannelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{panelChannelId:id})}/>
    </div>}
    {m.key==="welcome"&&<div className="moduleFields">
      <ChannelPicker label="Willkommens-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
      <label className="discordPickerLabel">Willkommensnachricht<input className="moduleTextInput" value={value.message??""} onChange={e=>update(m.key,{message:e.target.value})}/><small>Platzhalter: {"{user}"}, {"{username}"}, {"{server}"}</small></label>
    </div>}
    {m.key==="autorole"&&<div className="moduleFields">
      <RolePicker label="Automatische Rolle" value={value.roleId} roles={roles} placeholder="Rolle auswählen …" onChange={id=>update(m.key,{roleId:id})}/>
    </div>}
    {m.key==="selfroles"&&<div className="moduleFields">
      <ChannelPicker label="Rollen-Auswahl-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
      <label className="discordPickerLabel">Auswählbare Rollen <span className="discordPicker multiRolePicker"><select multiple value={(value.roles??[]).map((r:any)=>r.id)} onChange={e=>{const selected=Array.from(e.target.selectedOptions).map(o=>o.value);update(m.key,{roles:selected.map(id=>{const role=roles.find(r=>r.id===id);return {id,label:role?.name??"Rolle"};})});}}>{roles.map(role=><option key={role.id} value={role.id}>{role.name}</option>)}</select></span><small>Mehrere Rollen auswählen: STRG (Windows) oder CMD (Mac) gedrückt halten.</small></label>
    </div>}
    {m.key==="automod"&&<div className="moduleFields">
      <ChannelPicker label="Moderations-Log-Kanal" value={value.logChannelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{logChannelId:id})}/>
      <label className="discordPickerLabel">Erkennungs-Schwelle <select className="moduleTextInput" value={String(value.threshold??0.82)} onChange={e=>update(m.key,{threshold:Number(e.target.value)})}><option value="0.65">Niedrig – mehr Erkennungen</option><option value="0.82">Normal</option><option value="0.92">Hoch – weniger Erkennungen</option></select></label>
    </div>}
    </div>}
   </article>})}
   {settings&&<div className="manageSaveRow"><p>Änderungen werden nur für diesen Discord-Server gespeichert.</p><button className="heroCta" onClick={save} disabled={saving}><Save size={16}/>{saving?"Speichert …":"Änderungen speichern"}</button></div>}
  </section>
  <footer className="publicFooter"><b>MoonBot</b><span>Serververwaltung</span><a href="/impressum">Impressum</a></footer>
 </main>;
}
