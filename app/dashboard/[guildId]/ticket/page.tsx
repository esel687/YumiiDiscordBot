"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronDown, CirclePause, Folder,
  MessageSquare, Pencil, Plus, Save, Send, Settings, Trash2, Workflow,
  FileText, LoaderCircle
} from "lucide-react";

type TicketPanel = {
  id: string;
  name: string;
  channelId: string;
  messageId?: string;
  openLimitPerUser: number;
  pingTeam: boolean;
  channelNamePattern: string;
  showWorkload: boolean;
  onlyTeamCanClose: boolean;
  closeRequestNeedsClaim: boolean;
  creatorsCanAddUsers: boolean;
  onCreatorLeave: "nothing" | "close" | "delete";
  panelMessage: { title: string; description: string; thumbnailUrl: string; imageUrl: string; buttonLabel: string; buttonEmoji: string };
  welcomeMessage: { title: string; description: string; thumbnailUrl: string; imageUrl: string };
  categories?: TicketCategory[];
  snippets?: any[];
  automations?: any[];
};
type TicketCategory = { id: string; name: string; emoji: string; description: string; prefix: string; workloadLimit: number; teamRoleIds: string[]; discordCategoryId: string };
type Channel = { id: string; name: string; type: number; position: number };

const tabs = [
  { id: "allgemeines", label: "Allgemeines", icon: Settings },
  { id: "nachrichten", label: "Nachrichten", icon: FileText },
  { id: "kategorien", label: "Kategorien", icon: Folder },
  { id: "textbausteine", label: "Textbausteine", icon: MessageSquare },
  { id: "ablaeufe", label: "Abläufe", icon: Workflow }
];

export default function TicketDashboardPage() {
  const params = useParams<{ guildId: string }>();
  const router = useRouter();
  const guildId = params.guildId;
  const [settings, setSettings] = useState<any>({ enabled: true, logChannelId: "" });
  const [panels, setPanels] = useState<TicketPanel[]>([]);
  const [panel, setPanel] = useState<TicketPanel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);\n  const [serverName, setServerName] = useState("");\n  const [testingPreview, setTestingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("allgemeines");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const api = useCallback(async (path: string, method = "GET", body?: unknown) => {
    const response = await fetch("/api/guilds/" + guildId + "/ticket" + path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store"
    });
    const result = await response.json();
    if (!response.ok || result.ok === false) throw new Error(result.error || "Die Anfrage ist fehlgeschlagen.");
    return result.data;
  }, [guildId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, resourceResponse] = await Promise.all([
        api(""),
        fetch("/api/bot/resources?guildId=" + encodeURIComponent(guildId), { cache: "no-store" })
      ]);
      setSettings(data.settings);
      setPanels(data.panels || []);
      const resourceData = await resourceResponse.json();
      if (resourceResponse.ok) { setChannels((resourceData.channels || []).filter((channel: Channel) => [0, 5].includes(channel.type))); setServerName(resourceData.guildName || ""); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ticket-Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [api, guildId]);

  useEffect(() => { void load(); }, [load]);

  const channelOptions = useMemo(() => channels.slice().sort((a, b) => a.position - b.position), [channels]);

  async function toggleModule() {
    setSaving(true);
    setError("");
    try {
      const next = !settings.enabled;
      const data = await api("", "PATCH", { enabled: next });
      setSettings(data);
      setNotice(next ? "Modul aktiviert." : "Modul deaktiviert.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function createPanel() {
    setSaving(true);
    setError("");
    try {
      const created = await api("/panels", "POST", {});
      setPanel(created);
      setActiveTab("allgemeines");
      window.history.replaceState({}, "", window.location.pathname + "?panel=" + created.id + "&tab=allgemeines");
      setPanels(current => [...current, created]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Panel konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
    }
  }

  async function openPanel(id: string) {
    setLoading(true);
    setError("");
    try {
      const data = await api("/panels/" + id);
      setPanel(data);
      setActiveTab("allgemeines");
      window.history.replaceState({}, "", window.location.pathname + "?panel=" + id + "&tab=allgemeines");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Panel konnte nicht geöffnet werden.");
    } finally {
      setLoading(false);
    }
  }

  function updatePanel(patch: Partial<TicketPanel>) {
    setPanel(current => current ? { ...current, ...patch } : current);
  }

  async function savePanel() {
    if (!panel) return;
    if (!panel.name.trim()) { setError("Bitte gib einen Namen ein."); return; }
    setSaving(true);
    setError("");
    try {
      const saved = await api("/panels/" + panel.id, "PATCH", panel);
      setPanel(current => current ? { ...current, ...saved } : current);
      setPanels(current => current.map(item => item.id === saved.id ? { ...item, ...saved } : item));
      setNotice("Änderungen gespeichert.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function sendPanel() {
    if (!panel) return;
    await savePanel();
    setSending(true);
    setError("");
    try {
      const result = await api("/panels/" + panel.id + "/send", "POST", {});
      setNotice("Panel wurde gesendet. " + (result.url || ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Panel konnte nicht gesendet werden.");
    } finally {
      setSending(false);
    }
  }

  async function deletePanel() {
    if (!panel || !window.confirm("Dieses Panel und alle zugehörigen Einstellungen werden dauerhaft gelöscht. Bereits geöffnete Tickets bleiben bestehen. Panel löschen?")) return;
    setSaving(true);
    try {
      await api("/panels/" + panel.id, "DELETE");
      setPanels(current => current.filter(item => item.id !== panel.id));
      setPanel(null);
      window.history.replaceState({}, "", window.location.pathname);
      setNotice("Panel gelöscht.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Panel konnte nicht gelöscht werden.");
    } finally {
      setSaving(false);
    }
  }

  async function testPreview(kind: string, categoryId: string, withAnswers: boolean) {\n    if (!panel) return;\n    setTestingPreview(true);\n    setError("");\n    try {\n      const response = await fetch("/api/guilds/" + guildId + "/ticket/test-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, categoryId, withAnswers, panel }), cache: "no-store" });\n      const result = await response.json();\n      if (!response.ok || result.ok === false) throw new Error(result.error || "Testnachricht konnte nicht gesendet werden.");\n      setNotice("Die Vorschau wurde dir per Discord-DM gesendet.");\n    } catch (cause) { setError(cause instanceof Error ? cause.message : "Testnachricht konnte nicht gesendet werden."); }\n    finally { setTestingPreview(false); }\n  }\n\n  async function createCategory() {
    if (!panel || !newCategoryName.trim()) return;
    setSaving(true);
    try {
      const category = await api("/panels/" + panel.id + "/categories", "POST", { name: newCategoryName, emoji: "🎫" });
      setPanel(current => current ? { ...current, categories: [...(current.categories || []), category] } : current);
      setNewCategoryName("");
      setNotice("Kategorie erstellt.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kategorie konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory(category: TicketCategory, patch: Partial<TicketCategory>) {
    if (!panel) return;
    try {
      const saved = await api("/categories/" + category.id, "PATCH", { ...category, ...patch });
      setPanel(current => current ? { ...current, categories: (current.categories || []).map(item => item.id === saved.id ? saved : item) } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kategorie konnte nicht gespeichert werden.");
    }
  }

  async function removeCategory(category: TicketCategory) {
    if (!panel || !window.confirm("Kategorie wirklich löschen? Bereits erstellte Tickets bleiben bestehen.")) return;
    try {
      await api("/categories/" + category.id, "DELETE");
      setPanel(current => current ? { ...current, categories: (current.categories || []).filter(item => item.id !== category.id) } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kategorie konnte nicht gelöscht werden.");
    }
  }

  function changeTab(tab: string) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }

  if (loading) return <main className="dashboardShell"><div className="ticket-loading"><LoaderCircle className="ticket-spin"/> Ticket-Bereich wird geladen …</div></main>;

  return (
    <main className="dashboardShell ticket-page">
      <div className="ticket-topline">
        <button className="ticket-back" onClick={() => router.push("/dashboard/" + guildId)}><ArrowLeft size={16}/> Zur Serververwaltung</button>
        <a className="ticket-doc" href="#" onClick={event => event.preventDefault()}><BookOpen size={16}/> Dokumentation</a>
      </div>
      <header className="ticket-page-head">
        <div><h1>Ticket</h1><p>Erweitere deinen Server mit einem Ticket-System.</p></div>
      </header>
      {error && <div className="ticket-alert ticket-alert-error" role="alert">{error}</div>}
      {notice && <div className="ticket-alert" role="status">{notice}</div>}
      <section className={settings.enabled ? "ticket-status ticket-status-on" : "ticket-status"}>
        <div className="ticket-status-copy">
          {settings.enabled ? <CheckCircle2 size={22}/> : <CirclePause size={22}/>}
          <div><strong>{settings.enabled ? "Modul aktiviert" : "Modul deaktiviert"}</strong><p>{settings.enabled ? "Aktuell ist dieses Modul aktiviert. Durch einen Klick auf den Button wird das Modul wieder deaktiviert." : "Aktuell ist dieses Modul deaktiviert. Durch einen Klick auf den Button wird das Modul aktiviert."}</p></div>
        </div>
        <button className="ticket-button ticket-button-outline" disabled={saving} onClick={toggleModule}>{saving ? <LoaderCircle className="ticket-spin"/> : null}{settings.enabled ? "Deaktivieren" : "Aktivieren"}</button>
      </section>

      {!panel ? (
        <section className="ticket-card">
          <div className="ticket-card-head"><div><h2>Ticket-Panels</h2><p>Erstelle verschiedene Panels für unterschiedliche Anliegen.</p></div></div>
          {!panels.length && <p className="ticket-muted">Du hast noch kein Panel erstellt.</p>}
          <div className="ticket-panel-grid">
            {panels.map(item => <button key={item.id} className="ticket-panel-tile" onClick={() => openPanel(item.id)}><span>{item.name}</span><Pencil size={17}/></button>)}
            <button className="ticket-panel-create" disabled={panels.length >= 10 || saving} onClick={createPanel}><span>{panels.length >= 10 ? "Maximal 10 Panels pro Server." : "Neues Panel erstellen"}</span><Plus size={20}/></button>
          </div>
        </section>
      ) : (
        <section className="ticket-editor">
          <button className="ticket-back" onClick={() => { setPanel(null); window.history.replaceState({}, "", window.location.pathname); }}>← Zurück zu Ticket-Panels</button>
          <div className="ticket-editor-head"><div><h2>Ticket-Panel <span className="ticket-name-badge">{panel.name || "Neues Panel"}</span></h2></div><button className="ticket-button ticket-button-danger" onClick={deletePanel}><Trash2 size={16}/> Löschen</button></div>
          <div className="ticket-fields">
            <label className="ticket-field"><span>Name*</span><small>Name, wie das Panel heißen soll</small><input maxLength={50} value={panel.name} onChange={event => updatePanel({ name: event.target.value })}/><small className="ticket-counter">{panel.name.length} / 50</small></label>
            <label className="ticket-field"><span>Kanal*</span><small>Kanal, wo die Panel-Nachricht gesendet wird.</small><span className="ticket-select-wrap"><select value={panel.channelId} onChange={event => updatePanel({ channelId: event.target.value })}><option value="">Kanal auswählen …</option>{channelOptions.map(channel => <option key={channel.id} value={channel.id}># {channel.name}</option>)}</select><ChevronDown size={16}/></span></label>
          </div>
          <div className="ticket-editor-actions"><button className="ticket-button ticket-button-primary" disabled={saving} onClick={savePanel}><Save size={16}/> {saving ? "Speichert …" : "Speichern"}</button><button className="ticket-button ticket-button-outline" disabled={sending || !settings.enabled} onClick={sendPanel}><Send size={16}/> {sending ? "Wird gesendet …" : "Panel senden"}</button></div>
          <nav className="ticket-tabs" aria-label="Ticket-Panel-Einstellungen">
            {tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} className={activeTab === tab.id ? "ticket-tab active" : "ticket-tab"} onClick={() => changeTab(tab.id)}><Icon size={16}/>{tab.label}</button>; })}
          </nav>

          {activeTab === "allgemeines" && <div className="ticket-tab-content">
            <section className="ticket-card"><div className="ticket-card-head"><div><h3>Ticket erstellen</h3><p>Was gilt, wenn jemand über dieses Panel ein Ticket öffnet.</p></div></div>
              <label className="ticket-field"><span>Offene Tickets pro Nutzer</span><small>So viele Tickets darf ein Nutzer in diesem Panel gleichzeitig offen haben. 0 = kein Limit.</small><input type="number" min={0} max={25} value={panel.openLimitPerUser} onChange={event => updatePanel({ openLimitPerUser: Math.max(0, Math.min(25, Number(event.target.value))) })}/></label>
              <label className="ticket-check"><input type="checkbox" checked={panel.pingTeam} onChange={event => updatePanel({ pingTeam: event.target.checked })}/> Team markieren</label>
              <label className="ticket-field"><span>Name des Ticket-Kanals</span><small>Platzhalter werden beim Erstellen ersetzt.</small><input value={panel.channelNamePattern} maxLength={100} onChange={event => updatePanel({ channelNamePattern: event.target.value })}/><small>Platzhalter: %CASEID% · %TICKET_NUMBER% · %PREFIX% · %USERNAME% · %USER_ID% · %EMOTE%</small><small>Vorschau: ticket-0001</small></label>
              <label className="ticket-check"><input type="checkbox" checked={panel.showWorkload} onChange={event => updatePanel({ showWorkload: event.target.checked })}/> Auslastung im Panel anzeigen</label>
            </section>
            <section className="ticket-card"><div className="ticket-card-head"><div><h3>Im Ticket</h3><p>Was Ersteller und Team in einem offenen Ticket dürfen.</p></div></div>
              <label className="ticket-check"><input type="checkbox" checked={panel.onlyTeamCanClose} onChange={event => updatePanel({ onlyTeamCanClose: event.target.checked })}/> Nur das Team darf schließen</label>
              <label className="ticket-check"><input type="checkbox" checked={panel.closeRequestNeedsClaim} onChange={event => updatePanel({ closeRequestNeedsClaim: event.target.checked })}/> Schließanfrage nur nach Übernahme</label>
              <label className="ticket-check"><input type="checkbox" checked={panel.creatorsCanAddUsers} onChange={event => updatePanel({ creatorsCanAddUsers: event.target.checked })}/> Ersteller dürfen Personen hinzufügen</label>
              <label className="ticket-field"><span>Wenn der Ersteller den Server verlässt</span><select value={panel.onCreatorLeave} onChange={event => updatePanel({ onCreatorLeave: event.target.value as TicketPanel["onCreatorLeave"] })}><option value="nothing">Nichts tun</option><option value="close">Ticket schließen</option><option value="delete">Ticket löschen</option></select></label>
            </section>
          </div>}

          {activeTab === "nachrichten" && <div className="ticket-preview-layout">
            <div className="ticket-tab-content">
              <section className="ticket-card"><div className="ticket-card-head"><div><h3>Panel-Nachricht</h3><p>Die Nachricht im Panel-Kanal, über die Nutzer ein Ticket öffnen.</p></div></div>
                <label className="ticket-field"><span>Titel</span><input maxLength={256} value={panel.panelMessage.title} onChange={event => updatePanel({ panelMessage: { ...panel.panelMessage, title: event.target.value } })}/><small>{panel.panelMessage.title.length} / 256</small></label>
                <label className="ticket-field"><span>Beschreibung</span><textarea rows={5} maxLength={3800} value={panel.panelMessage.description} onChange={event => updatePanel({ panelMessage: { ...panel.panelMessage, description: event.target.value } })}/><small>{panel.panelMessage.description.length} / 3800</small></label>
                <div className="ticket-fields"><label className="ticket-field"><span>Thumbnail-URL</span><input value={panel.panelMessage.thumbnailUrl} onChange={event => updatePanel({ panelMessage: { ...panel.panelMessage, thumbnailUrl: event.target.value } })}/></label><label className="ticket-field"><span>Bild-URL</span><input value={panel.panelMessage.imageUrl} onChange={event => updatePanel({ panelMessage: { ...panel.panelMessage, imageUrl: event.target.value } })}/></label></div>
                <label className="ticket-field"><span>Button-Beschriftung</span><input maxLength={80} value={panel.panelMessage.buttonLabel} onChange={event => updatePanel({ panelMessage: { ...panel.panelMessage, buttonLabel: event.target.value } })}/></label>
              </section>
              <section className="ticket-card"><div className="ticket-card-head"><div><h3>Begrüßung im Ticket</h3><p>Die erste Nachricht in jedem neuen Ticket.</p></div></div>
                <label className="ticket-field"><span>Titel</span><input maxLength={256} value={panel.welcomeMessage.title} onChange={event => updatePanel({ welcomeMessage: { ...panel.welcomeMessage, title: event.target.value } })}/><small>{panel.welcomeMessage.title.length} / 256</small></label>
                <label className="ticket-field"><span>Beschreibung</span><textarea rows={4} maxLength={4000} value={panel.welcomeMessage.description} onChange={event => updatePanel({ welcomeMessage: { ...panel.welcomeMessage, description: event.target.value } })}/><small>{panel.welcomeMessage.description.length} / 4000</small></label>
                <div className="ticket-fields"><label className="ticket-field"><span>Thumbnail-URL</span><input value={panel.welcomeMessage.thumbnailUrl} onChange={event => updatePanel({ welcomeMessage: { ...panel.welcomeMessage, thumbnailUrl: event.target.value } })}/></label><label className="ticket-field"><span>Bild-URL</span><input value={panel.welcomeMessage.imageUrl} onChange={event => updatePanel({ welcomeMessage: { ...panel.welcomeMessage, imageUrl: event.target.value } })}/></label></div>
              </section>
            </div>
            <TicketMessagePreview panel={panel} serverName={serverName} guildId={guildId} onTest={testPreview} testing={testingPreview}/>
          </div>}

          {activeTab === "kategorien" && <section className="ticket-card"><div className="ticket-card-head"><div><h3>Kategorien</h3><p>Nutzer wählen beim Öffnen eine Kategorie.</p></div></div>
            {(panel.categories || []).map(category => <div className="ticket-category-row" key={category.id}><strong>{category.emoji} {category.name}</strong><input aria-label={"Name " + category.name} value={category.name} maxLength={50} onChange={event => setPanel(current => current ? { ...current, categories: (current.categories || []).map(item => item.id === category.id ? { ...item, name: event.target.value } : item) } : current)} onBlur={event => void updateCategory(category, { name: event.target.value })}/><button className="ticket-icon-button" onClick={() => removeCategory(category)} aria-label="Kategorie löschen"><Trash2 size={16}/></button></div>)}
            <div className="ticket-create-category"><input placeholder="Name der neuen Kategorie" value={newCategoryName} maxLength={50} onChange={event => setNewCategoryName(event.target.value)}/><button className="ticket-button ticket-button-primary" disabled={!newCategoryName.trim() || saving} onClick={createCategory}><Plus size={16}/> Kategorie erstellen</button></div>
          </section>}

          {activeTab === "textbausteine" && <section className="ticket-card"><div className="ticket-card-head"><div><h3>Textbausteine</h3><p>Vorgefertigte Antworten für dein Team.</p></div></div><p className="ticket-muted">Die Verwaltung und Verwendung von Textbausteinen wird im nächsten Umsetzungsschritt ergänzt.</p></section>}
          {activeTab === "ablaeufe" && <section className="ticket-card"><div className="ticket-card-head"><div><h3>Abläufe</h3><p>Automatisierungen für Tickets dieses Panels.</p></div></div><p className="ticket-muted">Automatische Abläufe werden im nächsten Umsetzungsschritt ergänzt.</p></section>}
        </section>
      )}
    </main>
  );
}
