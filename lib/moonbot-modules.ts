import { Gift, Headphones, Bell, UserPlus, Users, Ticket, ShieldCheck, Ban, Link2 } from "lucide-react";

export type ModuleField = {
  key: string;
  label: string;
  type: "text" | "number" | "channel" | "voice" | "category" | "role" | "select";
  placeholder?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  help?: string;
};

export const MOONBOT_MODULES = [
  { id: "giveaways", settingsKey: "giveaways", name: "Giveaways", group: "BOT-MODULE", description: "Veranstalte Gewinnspiele und lass deine Community per Reaktion teilnehmen.", icon: Gift, fields: [{ key: "channelId", label: "Gewinnspiel-Kanal", type: "channel" }] },
  { id: "tempvoice", settingsKey: "voiceMaster", name: "Temp Voice", group: "BOT-MODULE", description: "Erstelle automatisch persönliche Sprachräume, wenn Mitglieder den Startkanal betreten.", icon: Headphones, fields: [{ key: "joinChannelId", label: "Beitreten-zum-Erstellen-Kanal", type: "voice" }, { key: "categoryId", label: "Kategorie für temporäre Räume", type: "category" }, { key: "nameTemplate", label: "Raumname", type: "text", placeholder: "Raum von {username}", help: "Platzhalter: {username}" }, { key: "userLimit", label: "Nutzerlimit (0 = unbegrenzt)", type: "number", min: 0, max: 99 }] },
  { id: "welcome", settingsKey: "welcome", name: "Willkommensnachrichten", group: "BOT-MODULE", description: "Begrüße neue Mitglieder automatisch mit einer eigenen Nachricht.", icon: Bell, fields: [{ key: "channelId", label: "Willkommens-Kanal", type: "channel" }, { key: "message", label: "Willkommensnachricht", type: "text", placeholder: "Willkommen {user} auf {server}!", help: "Platzhalter: {user}, {username}, {server}" }, { key: "title", label: "Embed-Titel", type: "text" }, { key: "color", label: "Embed-Farbe", type: "text", placeholder: "#22d3ee" }] },
  { id: "autorole", settingsKey: "autorole", name: "Auto Role", group: "BOT-MODULE", description: "Weise neuen Mitgliedern automatisch eine festgelegte Rolle zu.", icon: UserPlus, fields: [{ key: "roleId", label: "Automatische Rolle", type: "role" }] },
  { id: "selfroles", settingsKey: "selfroles", name: "Self Roles", group: "BOT-MODULE", description: "Lass Mitglieder ihre eigenen Rollen über ein Auswahl-Panel verwalten.", icon: Users, fields: [{ key: "channelId", label: "Rollen-Auswahl-Kanal", type: "channel" }, { key: "panelTitle", label: "Panel-Titel", type: "text" }, { key: "panelDescription", label: "Beschreibung", type: "text" }, { key: "placeholder", label: "Auswahl-Platzhalter", type: "text" }] },
  { id: "ticket", settingsKey: "tickets", name: "Ticket", group: "BOT-MODULE", description: "Verwalte Support-Tickets, Nachrichten, Kategorien und Abläufe.", icon: Ticket, fields: [] },
  { id: "automod", settingsKey: "automod", name: "KI-Auto-Mod", group: "Sicherheit", description: "Erkenne problematische Nachrichten und lege fest, wie MoonBot darauf reagiert.", icon: ShieldCheck, fields: [{ key: "logChannelId", label: "Moderations-Log-Kanal", type: "channel" }, { key: "action", label: "Aktion", type: "select", options: [{ value: "delete_warn", label: "Nachricht löschen und warnen" }, { value: "delete", label: "Nur Nachricht löschen" }] }, { key: "threshold", label: "Erkennungs-Schwelle", type: "select", options: [{ value: "0.65", label: "Niedrig" }, { value: "0.82", label: "Normal" }, { value: "0.92", label: "Hoch" }] }] },
  { id: "antispam", settingsKey: "antiSpam", name: "Anti Spam", group: "Sicherheit", description: "Erkenne Nachrichten-Spam anhand eines Zeitfensters und einer Nachrichtenanzahl.", icon: Ban, fields: [{ key: "maxMessages", label: "Maximale Nachrichten", type: "number", min: 2, max: 15 }, { key: "intervalSeconds", label: "Zeitfenster in Sekunden", type: "number", min: 2, max: 30 }, { key: "action", label: "Aktion", type: "select", options: [{ value: "delete_warn", label: "Löschen und warnen" }, { value: "delete", label: "Nur löschen" }] }] },
  { id: "antilinks", settingsKey: "antiLinks", name: "Anti Links", group: "Sicherheit", description: "Begrenze unerwünschte Links und lege einen Ausnahme-Kanal fest.", icon: Link2, fields: [{ key: "allowedChannelId", label: "Ausnahme-Kanal", type: "channel" }, { key: "action", label: "Aktion", type: "select", options: [{ value: "delete_warn", label: "Löschen und warnen" }, { value: "delete", label: "Nur löschen" }] }] }
] as const satisfies readonly ( { id: string; settingsKey: string; name: string; group: string; description: string; icon: typeof Gift; fields: readonly ModuleField[] } )[];

export function getMoonBotModule(id: string) {
  return MOONBOT_MODULES.find(module => module.id === id);
}
