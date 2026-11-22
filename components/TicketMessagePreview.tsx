"use client";
import { useMemo, useState } from "react";
import { renderTicketPlaceholders } from "@/shared/ticket-message";
import { ChevronDown, ImageOff, Eye, EyeOff } from "lucide-react";

type Category = {
  id: string; name: string; emoji?: string; description?: string; workloadLimit?: number;
  teamRoleIds?: string[]; customWelcome?: { title?: string; description?: string; thumbnailUrl?: string; imageUrl?: string } | null;
  formQuestions?: { label: string; placeholder?: string; style?: string }[];
};
type Message = { title?: string; description?: string; thumbnailUrl?: string; imageUrl?: string; buttonLabel?: string; buttonEmoji?: string };
type Panel = { id: string; name: string; panelMessage: Message; welcomeMessage: Message; categories?: Category[]; creatorsCanAddUsers?: boolean; showWorkload?: boolean };
type Props = { panel: Panel; serverName?: string; guildId: string; onTest: (kind: string, categoryId: string, withAnswers: boolean) => Promise<void>; testing?: boolean };

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|`[^`]+`|<@[!&]?\d+>|<#\d+>|#[A-Za-z0-9_-]+|@[A-Za-z0-9_-]+|https?:\/\/[^\s]+)/g);
  return <>{parts.map((part, i) => {
    if (/^\*\*.+\*\*$/.test(part)) return <strong key={i}><InlineMarkdown text={part.slice(2,-2)}/></strong>;
    if (/^__.+__$/.test(part)) return <u key={i}>{part.slice(2,-2)}</u>;
    if (/^~~.+~~$/.test(part)) return <s key={i}>{part.slice(2,-2)}</s>;
    if (/^\*.+\*$/.test(part)) return <em key={i}>{part.slice(1,-1)}</em>;
    if (/^`.+`$/.test(part)) return <code className="ticket-preview-inline-code" key={i}>{part.slice(1,-1)}</code>;
    if (/^<@!?\d+>$/.test(part)) return <span className="ticket-preview-chip" key={i}>@Nutzer</span>;
    if (/^<@&\d+>$/.test(part)) return <span className="ticket-preview-chip" key={i}>@Rolle</span>;
    if (/^<#\d+>$/.test(part)) return <span className="ticket-preview-chip" key={i}>#kanal</span>;
    if (/^#[A-Za-z0-9_-]+$/.test(part)) return <span className="ticket-preview-chip" key={i}>#Kanal</span>;
    if (/^@[A-Za-z0-9_-]+$/.test(part)) return <span className="ticket-preview-chip" key={i}>{part}</span>;
    if (/^https?:\/\//.test(part)) return <a key={i} href={part} target="_blank" rel="noreferrer">{part}</a>;
    return <span key={i}>{part}</span>;
  })}</>;
}
function Markdown({ value }: { value: string }) {
  if (!value) return null;
  const lines = value.split("\n");
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let code: string[] = [];
  let inCode = false;
  const flush = () => { if (paragraph.length) { blocks.push(<p key={"p"+blocks.length}><InlineMarkdown text={paragraph.join(" ")}/></p>); paragraph=[]; } };
  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) { flush(); if (inCode) { blocks.push(<pre key={"c"+index}><code>{code.join("\n")}</code></pre>); code=[]; inCode=false; } else inCode=true; return; }
    if (inCode) { code.push(line); return; }
    if (!line.trim()) { flush(); return; }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) { flush(); const Tag = heading[1].length===1 ? "h3" : heading[1].length===2 ? "h4" : "h5"; blocks.push(<Tag key={"h"+index}><InlineMarkdown text={heading[2]}/></Tag>); return; }
    if (/^>\s?/.test(line)) { flush(); blocks.push(<blockquote key={"q"+index}><InlineMarkdown text={line.replace(/^>\s?/,"")}/></blockquote>); return; }
    if (/^\s*[-*]\s+/.test(line)) { flush(); blocks.push(<div className="ticket-preview-list" key={"l"+index}>• <InlineMarkdown text={line.replace(/^\s*[-*]\s+/,"")}/></div>); return; }
    paragraph.push(line);
  });
  flush();
  if (inCode && code.length) blocks.push(<pre key="unfinished"><code>{code.join("\n")}</code></pre>);
  return <div className="ticket-preview-markdown">{blocks}</div>;
}
function PreviewImage({ src, label }: { src?: string; label: string }) {
  const [failed,setFailed]=useState(false);
  if (!src) return null;
  if (failed) return <div className="ticket-preview-image-fallback"><ImageOff size={18}/>Bild konnte nicht geladen werden</div>;
  return <img className={label==="Thumbnail" ? "ticket-preview-thumb" : "ticket-preview-image"} src={src} alt={label} onError={()=>setFailed(true)}/>;
}
export default function TicketMessagePreview({ panel, serverName, guildId, onTest, testing=false }: Props) {
  const [kind,setKind]=useState("panel");
  const [categoryId,setCategoryId]=useState(panel.categories?.find(c=>c.customWelcome)?.id || "");
  const [withAnswers,setWithAnswers]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  const categories=panel.categories || [];
  const category=categories.find(c=>c.id===categoryId) || categories[0];
  const message=kind==="panel" ? panel.panelMessage : (kind==="category" && category?.customWelcome ? category.customWelcome : panel.welcomeMessage);
  const placeholders={ user:"@Beispielnutzer", username:"Beispielnutzer", category:category?.name || "Allgemein", ticket:"0001", server:serverName || "Dein Discord-Server", panel:panel.name, answers: withAnswers ? ((category?.formQuestions || []).map(q=>q.label+": Beispielantwort").join("\n") || "Beispielantworten aus dem Formular") : "Beispielantworten aus dem Formular" };
  const title=useMemo(()=>renderTicketPlaceholders(message?.title || "",placeholders),[message?.title,categoryId,category?.name,panel.name,serverName,withAnswers]);
  const description=useMemo(()=>renderTicketPlaceholders(message?.description || "",placeholders),[message?.description,categoryId,category?.name,panel.name,serverName,withAnswers]);
  const customCategories=categories.filter(c=>c.customWelcome);
  return <aside className="ticket-preview-wrap">
    <div className="ticket-preview-heading"><h3>Vorschau</h3><button type="button" className="ticket-preview-collapse" onClick={()=>setCollapsed(v=>!v)}>{collapsed ? <><Eye size={15}/> Vorschau anzeigen</> : <><EyeOff size={15}/> Vorschau ausblenden</>}</button></div>
    {!collapsed && <>
      <div className="ticket-preview-switch"><button className={kind==="panel"?"active":""} onClick={()=>setKind("panel")}>Panel-Nachricht</button><button className={kind==="welcome"?"active":""} onClick={()=>setKind("welcome")}>Begrüßung</button><button className={kind==="category"?"active":""} onClick={()=>setKind("category")}>Kategorie-Begrüßung</button></div>
      {kind==="category" && <select className="ticket-preview-select" value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Kategorie wählen …</option>{customCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
      {kind!=="panel" && category?.formQuestions?.length ? <label className="ticket-preview-answer-toggle"><input type="checkbox" checked={withAnswers} onChange={e=>setWithAnswers(e.target.checked)}/> Mit Formular-Antworten</label> : null}
      <div className="ticket-preview-discord">
        <div className="ticket-preview-author"><div className="ticket-preview-avatar">M</div><strong>MoonBot</strong><span>BOT</span><time>Heute um 12:00 Uhr</time></div>
        <div className="ticket-preview-embed"><div className="ticket-preview-embed-content">
          {title && <strong className="ticket-preview-title"><Markdown value={title}/></strong>}
          {description && <Markdown value={description}/>}
          {!title && !description && <span className="ticket-preview-empty">Noch kein Inhalt</span>}
          {kind!=="panel" && withAnswers && category?.formQuestions?.length ? <div className="ticket-preview-form-examples">{category.formQuestions.map((q,i)=><p key={i}><strong>{q.label || "Frage"}</strong><br/>Beispielantwort</p>)}</div> : null}
          <PreviewImage src={message?.imageUrl} label="Bild"/>
        </div>{message?.thumbnailUrl && <PreviewImage src={message.thumbnailUrl} label="Thumbnail"/>}</div>
        {kind==="panel" ? (categories.length===1 ? <div className="ticket-preview-controls"><button>{panel.panelMessage.buttonEmoji || "🎫"} {panel.panelMessage.buttonLabel || "Ticket erstellen"}</button></div> : <div className="ticket-preview-controls"><div className="ticket-preview-menu-label"><ChevronDown size={15}/> Wähle eine Kategorie</div>{categories.map(c=><div className="ticket-preview-option" key={c.id}><span>{c.emoji || "🎫"}</span><div><strong>{c.name}</strong>{c.description && <small>{c.description}</small>}{panel.showWorkload && c.workloadLimit ? <small>{Math.min(c.workloadLimit,2)}/{c.workloadLimit} offen</small> : null}</div></div>)}</div>) : <div className="ticket-preview-controls"><button>✓ Ticket übernehmen</button><button className="danger">✕ Ticket schließen</button>{panel.creatorsCanAddUsers && <button>＋ Person hinzufügen</button>}</div>}
      </div>
      <button className="ticket-preview-test" disabled={testing} onClick={()=>void onTest(kind,categoryId,withAnswers)}>{testing?"Wird gesendet …":"Vorschau in Discord testen"}</button>
    </>}
  </aside>;
}