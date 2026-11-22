"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AccountMenu from "../../../components/AccountMenu";
import { Bot, ArrowLeft, Ticket, Bell, UserPlus, Users, ShieldCheck, Save, Send, Hash, ChevronDown, ChevronRight, RefreshCw, MessageSquare, LogIn, LogOut, Star, Link2, ClipboardList, Ban, Filter, Timer, Gift, Vote, CaseSensitive, VolumeX, AtSign, GitBranch, Trash2, UsersRound, Pin, Headphones, BellRing } from "lucide-react";

type Guild={id:string;name:string;icon:string|null;owner:boolean};
type User={id:string;username:string;global_name:string|null;avatar:string|null;guilds:Guild[]};
type DiscordChannel={id:string;name:string;type:number;parentId:string;position:number};
type DiscordRole={id:string;name:string;color:string;position:number};
type Resources={channels:DiscordChannel[];roles:DiscordRole[]};
const modules=[
  {key:"giveaways",name:"Giveaways",icon:Gift,desc:"Wofür: Gewinnspiele für deine Community veranstalten. Kann: über /moonbot giveaway ein Gewinnspiel mit Preis und Laufzeit starten, an dem Mitglieder per 🎉-Reaktion teilnehmen."},
  {key:"voiceMaster",name:"Temp Voice",icon:Headphones,desc:"Wofür: Mitglieder bekommen eigene temporäre Sprachräume. Kann: beim Betreten des festgelegten Startkanals einen persönlichen Sprachkanal mit konfigurierbarem Namen und Nutzerlimit erstellen."},
  {key:"welcome",name:"Willkommensnachrichten",icon:Bell,desc:"Wofür: Neue Mitglieder willkommen heißen. Kann: beim Beitritt eine Nachricht im ausgewählten Kanal senden, mit anpassbarem Text, Titel, Farbe und optionaler Erwähnung."},
  {key:"autorole",name:"Auto Role",icon:UserPlus,desc:"Wofür: Neue Mitglieder direkt einer Startrolle zuweisen. Kann: jedem beitretenden Mitglied automatisch die ausgewählte Discord-Rolle geben."},
  {key:"selfroles",name:"Self Roles",icon:Users,desc:"Wofür: Mitglieder können passende Rollen selbst wählen. Kann: ein Rollen-Auswahl-Panel in einem Kanal bereitstellen und die dort konfigurierten Rollen zur Auswahl anbieten."},
  {key:"tickets",name:"Ticketsystem",category:"Sicherheit",icon:Ticket,desc:"Wofür: Mitglieder können Hilfe vom Team anfordern. Kann: private Ticket-Kanäle erstellen und dafür die festgelegte Support-Rolle sowie den Panel-Kanal verwenden."},
  {key:"automod",name:"KI-Auto-Mod",category:"Sicherheit",icon:ShieldCheck,desc:"Wofür: Problematische Nachrichten in der Community erkennen. Kann: Nachrichten mithilfe der verbundenen KI prüfen und je nach Einstellung löschen und/oder im Moderationskanal protokollieren."},
  {key:"antiSpam",name:"Anti Spam",category:"Sicherheit",icon:Ban,desc:"Wofür: Schnelles Zuspammen von Textkanälen verhindern. Kann: eine festgelegte Nachrichtenanzahl innerhalb eines Zeitfensters erkennen und Nachrichten löschen sowie warnen."},
  {key:"antiLinks",name:"Anti Links",category:"Sicherheit",icon:Link2,desc:"Wofür: Unerwünschte Links in der Community begrenzen. Kann: Links außerhalb des ausgewählten Ausnahme-Kanals erkennen und je nach Einstellung löschen und warnen."}
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
 const [resources,setResources]=useState<Resources|null>(null); const [error,setError]=useState(""); const [resourceError,setResourceError]=useState(""); const [aiConfigured,setAiConfigured]=useState<boolean|null>(null);
 const [saving,setSaving]=useState(false); const [publishingPanel,setPublishingPanel]=useState(false); const [panelNotice,setPanelNotice]=useState(""); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [activeModule,setActiveModule]=useState<string>("tickets");
 const guild=user?.guilds?.find(g=>g.id===guildId);
 const textChannels=useMemo(()=>resources?.channels.filter(c=>[0,5,15,16].includes(c.type))??[],[resources]);
 const categories=useMemo(()=>resources?.channels.filter(c=>c.type===4)??[],[resources]);
 const voiceChannels=useMemo(()=>resources?.channels.filter(c=>c.type===2)??[],[resources]);
 const roles=resources?.roles??[];
 useEffect(()=>{fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json()).then(d=>setUser(d.user??null)).catch(()=>setError("Sitzung konnte nicht geladen werden.")).finally(()=>setLoading(false));},[]);
 useEffect(()=>{if(!guildId||!user)return;fetch("/api/bot/settings?guildId="+encodeURIComponent(guildId),{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Einstellungen konnten nicht geladen werden.");setSettings(d.settings);setAiConfigured(d.aiConfigured===true);}).catch(e=>setError(e.message));},[guildId,user]);
 const loadResources=async()=>{if(!guildId)return;setRefreshing(true);setResourceError("");try{const r=await fetch("/api/bot/resources?guildId="+encodeURIComponent(guildId),{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Serverdaten konnten nicht geladen werden.");setResources(d);}catch(e:any){setResourceError(e.message||"Serverdaten konnten nicht geladen werden.");}finally{setRefreshing(false);}};
 useEffect(()=>{if(user&&guildId)loadResources();},[user,guildId]);
 const update=(key:string,patch:any)=>setSettings((s:any)=>({...s,[key]:{...s[key],...patch}}));
 const save=async()=>{if(!settings)return;setSaving(true);setError("");try{const r=await fetch("/api/bot/settings?guildId="+encodeURIComponent(guildId),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({settings})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Speichern fehlgeschlagen.");setSettings(d.settings);setAiConfigured(d.aiConfigured===true);}catch(e:any){setError(e.message||"Speichern fehlgeschlagen.");}finally{setSaving(false);}};
 const publishTicketPanel=async()=>{if(!settings)return;setPublishingPanel(true);setPanelNotice("");setError("");try{
  const saved=await fetch("/api/bot/settings?guildId="+encodeURIComponent(guildId),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({settings})});
  const savedData=await saved.json();if(!saved.ok)throw new Error(savedData.error||"Einstellungen konnten nicht gespeichert werden.");setSettings(savedData.settings);
  const response=await fetch("/api/bot/ticket-panel?guildId="+encodeURIComponent(guildId),{method:"POST"});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Ticket-Panel konnte nicht veröffentlicht werden.");
  setPanelNotice("Ticket-Panel wurde erfolgreich in Discord veröffentlicht.");
 }catch(e:any){setPanelNotice(e.message||"Ticket-Panel konnte nicht veröffentlicht werden.");}finally{setPublishingPanel(false);}};
 if(loading)return <main className="dashboardShell"><p className="moduleNotice">Server wird geladen …</p></main>;
 if(!user||!guild)return <main className="dashboardShell"><a className="backLink" href="/dashboard"><ArrowLeft size={15}/> Zur Serverübersicht</a><section className="emptyServers">Dieser Server ist nicht in deiner Sitzung enthalten oder du hast keine Verwaltungsrechte. <a href="/api/auth/discord">Erneut mit Discord anmelden</a>.</section></main>;
 return <main className="dashboardShell">
  <header className="dashboardTop"><a className="brand" href="/"><span className="brandIcon"><img src="/moonbot-logo.svg" alt="MoonBot Logo"/></span><span>Moon<span className="accent">Bot</span></span></a><div className="dashboardTopRight"><AccountMenu userId={user.id} username={user.username} displayName={user.global_name} avatar={user.avatar}/></div></header>
  <section className="dashboardIntro"><a className="backLink" href="/dashboard"><ArrowLeft size={15}/> Alle Server</a><div className="selectedServerHero"><span className="serverAvatar">{guild.icon?<img src={"https://cdn.discordapp.com/icons/"+guild.id+"/"+guild.icon+".png?size=96"} alt=""/>:guild.name.slice(0,1).toUpperCase()}</span><div><div className="eyebrow">SERVERVERWALTUNG</div><h1>{guild.name}</h1><p>Wähle Kanäle und Rollen direkt aus deinem Discord-Server aus.</p></div></div></section>
  <section className="manageSection">
   <div className="sectionHead"><div><h2>Serververwaltung</h2><p>Wähle links ein Modul aus, um es zu konfigurieren.</p></div><span className="serverCount">{modules.length} MODULE</span></div>
   {error&&<div className="moduleNotice" role="alert">{error}</div>}
   {resourceError&&<div className="moduleNotice resourceNotice"><div>{resourceError}</div><button onClick={loadResources} disabled={refreshing}><RefreshCw size={14}/> Erneut laden</button><small>MoonBot muss online sein und Zugriff auf die Serverkanäle und Rollen haben.</small></div>}
   {!resources&&!resourceError&&<div className="moduleNotice">Lade Kanäle und Rollen von Discord …</div>}
   {!settings&&!error&&<div className="moduleNotice">Lade Servereinstellungen …</div>}
   {settings&&<div className="moduleWorkspace">
    <aside className="moduleSidebar"><div className="moduleSidebarTitle">BOT-MODULE</div>
     {modules.map((m,index)=>{const Icon=m.icon;const value=settings[m.key]??{};return <Fragment key={m.key}>{m.category&&(index===0||modules[index-1].category!==m.category)&&<div className="moduleSidebarTitle">{m.category}</div>}<button className={activeModule===m.key?"moduleNavItem active":"moduleNavItem"} onClick={()=>setActiveModule(m.key)}><Icon size={17}/><span>{m.name}</span><i className={value.enabled?"moduleStatus enabled":"moduleStatus"} /></button></Fragment>;})}
    </aside>
    <div className="moduleWorkspaceMain">
     {modules.filter(m=>m.key===activeModule).map(m=>{const Icon=m.icon;const value=settings[m.key]??{};return <article className="moduleManagePanel" key={m.key}>
      <div className="modulePanelHeader"><span className="manageIcon"><Icon/></span><div><h2>{m.name}</h2><p>{m.desc}</p></div><button className={value.enabled?"moduleToggle on":"moduleToggle"} onClick={()=>update(m.key,{enabled:!value.enabled})}>{value.enabled?"Aktiv":"Aus"}</button></div>
      <div className="moduleEditor"><div className="moduleEditorTitle"><strong>Einrichtung</strong><span>In drei einfachen Schritten: Modul einschalten, Einstellungen auswählen und unten speichern. Du kannst alles später jederzeit ändern.</span><div className="moduleSetupSteps"><span><b>1</b> Aktivieren</span><span><b>2</b> Anpassen</span><span><b>3</b> Speichern</span></div></div>
      {m.key==="tickets"&&<div className="moduleFields">
       <ChannelPicker label="Ticket-Kategorie" value={value.categoryId} channels={categories} emptyLabel="Kategorie auswählen …" onChange={id=>update(m.key,{categoryId:id})}/>
       <RolePicker label="Support-Rolle" value={value.supportRoleId} roles={roles} placeholder="Rolle auswählen …" onChange={id=>update(m.key,{supportRoleId:id})}/>
       <ChannelPicker label="Ticket-Panel-Kanal" value={value.panelChannelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{panelChannelId:id})}/>
       <label className="discordPickerLabel">Panel-Titel<input className="moduleTextInput" value={value.panelTitle??"Support benötigt?"} maxLength={100} onChange={e=>update(m.key,{panelTitle:e.target.value})}/></label>
       <label className="discordPickerLabel">Beschreibung<textarea className="moduleTextInput" rows={3} value={value.panelDescription??""} maxLength={1000} onChange={e=>update(m.key,{panelDescription:e.target.value})}/></label>
       <label className="discordPickerLabel">Button-Beschriftung<input className="moduleTextInput" value={value.buttonLabel??"Ticket erstellen"} maxLength={80} onChange={e=>update(m.key,{buttonLabel:e.target.value})}/></label>
       <label className="discordPickerLabel">Embed-Farbe<input type="color" className="moduleTextInput" value={value.color??"#22d3ee"} onChange={e=>update(m.key,{color:e.target.value})}/></label>
       <div className="discordPreview"><div className="discordPreviewTop"><span>VORSCHAU · DISCORD</span><span>LIVE</span></div><div className="discordPreviewMessage"><div className="discordPreviewAvatar">M</div><div><b>MoonBot</b><small> BOT</small><div className="discordEmbed" style={{borderLeftColor:value.color||"#22d3ee"}}><strong>{value.panelTitle||"Support benötigt?"}</strong><p>{value.panelDescription||"Klicke auf die Schaltfläche, um ein privates Support-Ticket zu erstellen."}</p><span className="discordFakeButton">🎫 {value.buttonLabel||"Ticket erstellen"}</span></div></div></div></div>
       <div className="moduleActionRow"><button className="heroCta" onClick={publishTicketPanel} disabled={publishingPanel||saving||!value.enabled||!value.panelChannelId}><Send size={16}/>{publishingPanel?"Wird veröffentlicht …":"Ticket-Panel in Discord veröffentlichen"}</button>{panelNotice&&<p className="moduleNotice" role="status">{panelNotice}</p>}</div>
      </div>}
      {m.key==="welcome"&&<div className="moduleFields">
       <ChannelPicker label="Willkommens-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <label className="discordPickerLabel">Willkommensnachricht<input className="moduleTextInput" value={value.message??""} maxLength={500} onChange={e=>update(m.key,{message:e.target.value})}/><small>Platzhalter: {"{user}"}, {"{username}"}, {"{server}"}</small></label>
       <label className="discordPickerLabel">Embed-Titel<input className="moduleTextInput" value={value.title??""} maxLength={100} onChange={e=>update(m.key,{title:e.target.value})}/></label>
       <label className="discordPickerLabel">Embed-Farbe<input type="color" className="moduleTextInput" value={value.color??"#22d3ee"} onChange={e=>update(m.key,{color:e.target.value})}/></label>
       <label className="discordPickerLabel"><span><input type="checkbox" checked={value.mentionUser!==false} onChange={e=>update(m.key,{mentionUser:e.target.checked})}/> Mitglied erwähnen</span></label>
       <div className="discordPreview"><div className="discordPreviewTop"><span>VORSCHAU · DISCORD</span><span>LIVE</span></div><div className="discordPreviewMessage"><div className="discordPreviewAvatar">M</div><div><b>MoonBot</b><small> BOT</small><div className="discordEmbed" style={{borderLeftColor:value.color||"#22d3ee"}}>{value.title&&<strong>{value.title}</strong>}<p>{(value.message||"Willkommen {user} auf {server}!").replaceAll("{user}","@NeuesMitglied").replaceAll("{username}","NeuesMitglied").replaceAll("{server}",guild.name)}</p></div></div></div></div>
      </div>}
      {m.key==="autorole"&&<div className="moduleFields"><RolePicker label="Automatische Rolle" value={value.roleId} roles={roles} placeholder="Rolle auswählen …" onChange={id=>update(m.key,{roleId:id})}/></div>}
      {m.key==="selfroles"&&<div className="moduleFields">
       <ChannelPicker label="Rollen-Auswahl-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <label className="discordPickerLabel">Auswählbare Rollen <span className="discordPicker multiRolePicker"><select multiple value={(value.roles??[]).map((r:any)=>r.id)} onChange={e=>{const selected=Array.from(e.target.selectedOptions).map(o=>o.value);update(m.key,{roles:selected.map(id=>{const role=roles.find(r=>r.id===id);return {id,label:role?.name??"Rolle"};})});}}>{roles.map(role=><option key={role.id} value={role.id}>{role.name}</option>)}</select></span><small>Mehrere Rollen auswählen: STRG (Windows) oder CMD (Mac) gedrückt halten.</small></label>
       <label className="discordPickerLabel">Panel-Titel<input className="moduleTextInput" value={value.panelTitle??"Deine Rollen"} maxLength={100} onChange={e=>update(m.key,{panelTitle:e.target.value})}/></label>
       <label className="discordPickerLabel">Beschreibung<textarea className="moduleTextInput" rows={3} value={value.panelDescription??""} maxLength={1000} onChange={e=>update(m.key,{panelDescription:e.target.value})}/></label>
       <label className="discordPickerLabel">Auswahl-Platzhalter<input className="moduleTextInput" value={value.placeholder??"Wähle deine Rollen"} maxLength={100} onChange={e=>update(m.key,{placeholder:e.target.value})}/></label>
       <div className="discordPreview"><div className="discordPreviewTop"><span>VORSCHAU · DISCORD</span><span>LIVE</span></div><div className="discordPreviewMessage"><div className="discordPreviewAvatar">M</div><div><b>MoonBot</b><small> BOT</small><div className="discordEmbed"><strong>{value.panelTitle||"Deine Rollen"}</strong><p>{value.panelDescription||"Wähle die Rollen aus, die du haben möchtest."}</p><div className="discordFakeSelect">{(value.roles??[]).map((r:any)=><span key={r.id}>{r.label}</span>)}{!(value.roles??[]).length&&"Noch keine Rollen ausgewählt"}</div></div></div></div></div>
      </div>}
      {m.key==="leave"&&<div className="moduleFields">
       <ChannelPicker label="Abschieds-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <label className="discordPickerLabel">Abschiedsnachricht<input className="moduleTextInput" value={value.message??""} maxLength={500} onChange={e=>update(m.key,{message:e.target.value})}/><small>Platzhalter: {"{user}"}, {"{username}"}, {"{server}"}</small></label>
       <div className="discordPreview"><div className="discordPreviewTop"><span>VORSCHAU · DISCORD</span><span>LIVE</span></div><div className="discordPreviewMessage"><div className="discordPreviewAvatar">M</div><div><b>MoonBot</b><small> BOT</small><p>{(value.message||"{username} hat den Server verlassen. Tschüss!").replaceAll("{user}","@Mitglied").replaceAll("{username}","Mitglied").replaceAll("{server}",guild.name)}</p></div></div></div>
      </div>}
      {m.key==="suggestions"&&<div className="moduleFields">
       <ChannelPicker label="Vorschlags-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <ChannelPicker label="Team-/Review-Kanal (optional)" value={value.reviewChannelId} channels={textChannels} emptyLabel="Kein separater Kanal" onChange={id=>update(m.key,{reviewChannelId:id})}/>
       <label className="discordPickerLabel">Embed-Titel<input className="moduleTextInput" value={value.title??"Neuer Vorschlag"} maxLength={100} onChange={e=>update(m.key,{title:e.target.value})}/></label>
       <label className="discordPickerLabel">Embed-Farbe<input type="color" className="moduleTextInput" value={value.color??"#22d3ee"} onChange={e=>update(m.key,{color:e.target.value})}/></label>
       <div className="discordPreview"><div className="discordPreviewTop"><span>VORSCHAU · DISCORD</span><span>LIVE</span></div><div className="discordPreviewMessage"><div className="discordPreviewAvatar">M</div><div><b>MoonBot</b><small> BOT</small><div className="discordEmbed" style={{borderLeftColor:value.color||"#22d3ee"}}><strong>{value.title||"Neuer Vorschlag"}</strong><p>Hier steht der Vorschlag aus deiner Community.</p><span>👍 0　👎 0</span></div></div></div></div>
      </div>}
      {m.key==="starboard"&&<div className="moduleFields">
       <ChannelPicker label="Starboard-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <label className="discordPickerLabel">Benötigte Reaktionen<input type="number" min="1" max="20" className="moduleTextInput" value={value.threshold??3} onChange={e=>update(m.key,{threshold:Number(e.target.value)})}/></label>
       <label className="discordPickerLabel">Emoji<input className="moduleTextInput" value={value.emoji??"⭐"} maxLength={8} onChange={e=>update(m.key,{emoji:e.target.value})}/></label>
      </div>}
      {m.key==="antiInvite"&&<div className="moduleFields">
       <ChannelPicker label="Ausnahme-Kanal (Einladungslinks erlaubt)" value={value.allowedChannelId} channels={textChannels} emptyLabel="Keine Ausnahme" onChange={id=>update(m.key,{allowedChannelId:id})}/>
       <label className="discordPickerLabel">Aktion<select className="moduleTextInput" value={value.action??"delete_warn"} onChange={e=>update(m.key,{action:e.target.value})}><option value="delete_warn">Link löschen und warnen</option><option value="delete">Nur Link löschen</option></select></label>
      </div>}

      {m.key==="antiSpam"&&<div className="moduleFields">
       <label className="discordPickerLabel">Maximale Nachrichten<input className="moduleTextInput" type="number" min="2" max="15" value={value.maxMessages??5} onChange={e=>update(m.key,{maxMessages:Number(e.target.value)})}/></label>
       <label className="discordPickerLabel">Zeitfenster in Sekunden<input className="moduleTextInput" type="number" min="2" max="30" value={value.intervalSeconds??6} onChange={e=>update(m.key,{intervalSeconds:Number(e.target.value)})}/></label>
       <label className="discordPickerLabel">Aktion<select className="moduleTextInput" value={value.action??"delete_warn"} onChange={e=>update(m.key,{action:e.target.value})}><option value="delete_warn">Löschen und warnen</option><option value="delete">Nur löschen</option></select></label>
      </div>}
      {m.key==="antiCaps"&&<div className="moduleFields">
       <label className="discordPickerLabel">Mindestlänge<input className="moduleTextInput" type="number" min="5" max="100" value={value.minLength??12} onChange={e=>update(m.key,{minLength:Number(e.target.value)})}/></label>
       <label className="discordPickerLabel">Großbuchstaben-Anteil (%)<input className="moduleTextInput" type="number" min="50" max="100" value={value.percentage??75} onChange={e=>update(m.key,{percentage:Number(e.target.value)})}/></label>
       <label className="discordPickerLabel">Aktion<select className="moduleTextInput" value={value.action??"delete_warn"} onChange={e=>update(m.key,{action:e.target.value})}><option value="delete_warn">Löschen und warnen</option><option value="delete">Nur löschen</option></select></label>
      </div>}
      {m.key==="antiLinks"&&<div className="moduleFields">
       <ChannelPicker label="Ausnahme-Kanal (Links erlaubt)" value={value.allowedChannelId} channels={textChannels} emptyLabel="Keine Ausnahme" onChange={id=>update(m.key,{allowedChannelId:id})}/>
       <label className="discordPickerLabel">Aktion<select className="moduleTextInput" value={value.action??"delete_warn"} onChange={e=>update(m.key,{action:e.target.value})}><option value="delete_warn">Löschen und warnen</option><option value="delete">Nur löschen</option></select></label>
      </div>}
      {m.key==="keywordFilter"&&<div className="moduleFields">
       <label className="discordPickerLabel">Gesperrte Begriffe<textarea className="moduleTextInput" rows={4} placeholder="Ein Begriff pro Zeile" value={(value.words??[]).join("\n")} onChange={e=>update(m.key,{words:e.target.value.split(/\r?\n/).map((word:string)=>word.trim()).filter(Boolean)})}/><small>Bis zu 100 Begriffe.</small></label>
       <ChannelPicker label="Filter-Log-Kanal" value={value.logChannelId} channels={textChannels} emptyLabel="Kein Log-Kanal" onChange={id=>update(m.key,{logChannelId:id})}/>
       <label className="discordPickerLabel">Aktion<select className="moduleTextInput" value={value.action??"delete_warn"} onChange={e=>update(m.key,{action:e.target.value})}><option value="delete_warn">Löschen und warnen</option><option value="delete">Nur löschen</option></select></label>
      </div>}
      {m.key==="slowmode"&&<div className="moduleFields">
       <ChannelPicker label="Slowmode-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <label className="discordPickerLabel">Sekunden zwischen Nachrichten<input className="moduleTextInput" type="number" min="0" max="21600" value={value.seconds??5} onChange={e=>update(m.key,{seconds:Number(e.target.value)})}/></label>
      </div>}
      {m.key==="counting"&&<div className="moduleFields">
       <ChannelPicker label="Zähl-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <label className="discordPickerLabel">Startzahl<input className="moduleTextInput" type="number" min="1" value={value.startNumber??1} onChange={e=>update(m.key,{startNumber:Number(e.target.value),lastNumber:0})}/></label>
       <div className="discordPreview"><div className="discordPreviewTop"><span>VORSCHAU · DISCORD</span><span>LIVE</span></div><div className="discordPreviewMessage"><div className="discordPreviewAvatar">M</div><div><b>MoonBot</b><small> BOT</small><p>🔢 Schreibe die Zahl {value.startNumber||1} als Nächstes.</p></div></div></div>
      </div>}
      {m.key==="polls"&&<div className="moduleFields">
       <ChannelPicker label="Umfragen-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Aktuellen Kanal verwenden" onChange={id=>update(m.key,{channelId:id})}/>
       <div className="discordPreview"><div className="discordPreviewTop"><span>VORSCHAU · DISCORD</span><span>LIVE</span></div><div className="discordPreviewMessage"><div className="discordPreviewAvatar">M</div><div><b>MoonBot</b><small> BOT</small><div className="discordEmbed"><strong>📊 Umfrage</strong><p>Soll dieses Feature hinzugefügt werden?</p><p>👍 Ja　👎 Nein</p></div></div></div></div>
       <small>Erstellen mit <code>/moonbot poll</code>.</small>
      </div>}
      {m.key==="giveaways"&&<div className="moduleFields">
       <ChannelPicker label="Giveaway-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Aktuellen Kanal verwenden" onChange={id=>update(m.key,{channelId:id})}/>
       <div className="discordPreview"><div className="discordPreviewTop"><span>VORSCHAU · DISCORD</span><span>LIVE</span></div><div className="discordPreviewMessage"><div className="discordPreviewAvatar">M</div><div><b>MoonBot</b><small> BOT</small><div className="discordEmbed"><strong>🎉 Giveaway</strong><p>Gewinn: Beispielpreis</p><p>Reagiere mit 🎉, um teilzunehmen!</p></div></div></div></div>
       <small>Starten mit <code>/moonbot giveaway</code>. Die Laufzeit wird beim Start angegeben.</small>
      </div>}

      {m.key==="antiMassMention"&&<div className="moduleFields">
       <label className="discordPickerLabel">Maximale Erwähnungen<input className="moduleTextInput" type="number" min="2" max="20" value={value.maxMentions??5} onChange={e=>update(m.key,{maxMentions:Number(e.target.value)})}/></label>
       <label className="discordPickerLabel">Aktion<select className="moduleTextInput" value={value.action??"delete_warn"} onChange={e=>update(m.key,{action:e.target.value})}><option value="delete_warn">Löschen und warnen</option><option value="delete">Nur löschen</option></select></label>
      </div>}
      {m.key==="autoThread"&&<div className="moduleFields">
       <ChannelPicker label="Thread-Ausgangskanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <label className="discordPickerLabel">Auto-Archivierung<select className="moduleTextInput" value={value.archiveMinutes??1440} onChange={e=>update(m.key,{archiveMinutes:Number(e.target.value)})}><option value="60">1 Stunde</option><option value="1440">24 Stunden</option><option value="4320">3 Tage</option><option value="10080">7 Tage</option></select></label>
      </div>}
      {m.key==="messageCleanup"&&<div className="moduleFields">
       <ChannelPicker label="Auto-Lösch-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <label className="discordPickerLabel">Löschverzögerung in Sekunden<input className="moduleTextInput" type="number" min="5" max="86400" value={value.delaySeconds??30} onChange={e=>update(m.key,{delaySeconds:Number(e.target.value)})}/></label>
      </div>}
      {m.key==="memberCounter"&&<div className="moduleFields">
       <ChannelPicker label="Zähler-Kanal" value={value.channelId} channels={[...textChannels,...voiceChannels]} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <label className="discordPickerLabel">Kanalname-Vorlage<input className="moduleTextInput" value={value.nameTemplate??"Mitglieder: {count}"} maxLength={80} onChange={e=>update(m.key,{nameTemplate:e.target.value})}/><small>Platzhalter: {"{count}"}</small></label>
      </div>}
      {m.key==="autoPin"&&<div className="moduleFields">
       <label className="discordPickerLabel">Reaktions-Emoji<input className="moduleTextInput" value={value.emoji??"📌"} maxLength={8} onChange={e=>update(m.key,{emoji:e.target.value})}/></label>
       <label className="discordPickerLabel">Benötigte Reaktionen<input className="moduleTextInput" type="number" min="2" max="20" value={value.threshold??5} onChange={e=>update(m.key,{threshold:Number(e.target.value)})}/></label>
      </div>}
      {m.key==="voiceMaster"&&<div className="moduleFields">
       <ChannelPicker label="Beitreten-zum-Erstellen-Kanal" value={value.joinChannelId} channels={voiceChannels} emptyLabel="Sprachkanal auswählen …" onChange={id=>update(m.key,{joinChannelId:id})}/>
       <ChannelPicker label="Kategorie für temporäre Räume" value={value.categoryId} channels={categories} emptyLabel="Keine Kategorie" onChange={id=>update(m.key,{categoryId:id})}/>
       <label className="discordPickerLabel">Raumname<input className="moduleTextInput" value={value.nameTemplate??"Raum von {username}"} maxLength={80} onChange={e=>update(m.key,{nameTemplate:e.target.value})}/><small>Platzhalter: {"{username}"}</small></label>
       <label className="discordPickerLabel">Nutzerlimit (0 = unbegrenzt)<input className="moduleTextInput" type="number" min="0" max="99" value={value.userLimit??0} onChange={e=>update(m.key,{userLimit:Number(e.target.value)})}/></label>
      </div>}
      {m.key==="bumpReminder"&&<div className="moduleFields">
       <ChannelPicker label="Erinnerungs-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       <label className="discordPickerLabel">Erinnerung nach Stunden<input className="moduleTextInput" type="number" min="1" max="24" value={value.intervalHours??2} onChange={e=>update(m.key,{intervalHours:Number(e.target.value)})}/></label>
       <small>Erkennt die Bestätigung des Disboard-Bots nach einem erfolgreichen Bump.</small>
      </div>}
      {m.key==="logs"&&<div className="moduleFields">
       <ChannelPicker label="Log-Kanal" value={value.channelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{channelId:id})}/>
       {([["messageDelete","Gelöschte Nachrichten"],["messageEdit","Bearbeitete Nachrichten"],["memberJoin","Beitritte"],["memberLeave","Austritte"]] as const).map(([key,label])=><label className="discordPickerLabel" key={key}><span><input type="checkbox" checked={value[key]!==false} onChange={e=>update(m.key,{[key]:e.target.checked})}/> {label}</span></label>)}
      </div>}
      {m.key==="automod"&&<div className="moduleFields">
       <div className="moduleNotice" role="status">{aiConfigured===true?"OpenAI-KI verbunden. Nachrichten werden automatisch geprüft.":aiConfigured===false?"OpenAI-KI noch nicht verbunden. Hinterlege OPENAI_API_KEY in den Umgebungsvariablen deines Bot-Hostings.":"KI-Verbindungsstatus wird geladen …"}</div>
       <ChannelPicker label="Moderations-Log-Kanal" value={value.logChannelId} channels={textChannels} emptyLabel="Kanal auswählen …" onChange={id=>update(m.key,{logChannelId:id})}/>
       <label className="discordPickerLabel">Aktion <select className="moduleTextInput" value={value.action??"delete_warn"} onChange={e=>update(m.key,{action:e.target.value})}><option value="delete_warn">Nachricht löschen und warnen</option><option value="delete">Nur Nachricht löschen</option></select></label>
       <label className="discordPickerLabel">Erkennungs-Schwelle <select className="moduleTextInput" value={String(value.threshold??0.82)} onChange={e=>update(m.key,{threshold:Number(e.target.value)})}><option value="0.65">Niedrig – mehr Erkennungen</option><option value="0.82">Normal</option><option value="0.92">Hoch – weniger Erkennungen</option></select></label>
      </div>}
      </div>
     </article>;})}
     <div className="manageSaveRow"><p><b>Fast geschafft!</b><br/>Deine Änderungen gelten nur für {guild.name}. Klicke auf Speichern, damit MoonBot sie übernimmt.</p><button className="heroCta" onClick={save} disabled={saving}><Save size={16}/>{saving?"Speichert …":"Änderungen speichern"}</button></div>
    </div>
   </div>}
  </section>
  <footer className="publicFooter"><b>MoonBot</b><span>Serververwaltung</span><a href="/impressum">Impressum</a></footer>
 </main>;
}
