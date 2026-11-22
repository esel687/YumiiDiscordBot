const fs = require("node:fs");
const path = require("node:path");
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "guild-settings.json");
function readAll() {
  try { if (!fs.existsSync(dataFile)) return {}; return JSON.parse(fs.readFileSync(dataFile, "utf8")); }
  catch (error) { console.error("Could not read guild settings:", error); return {}; }
}
function writeAll(data) {
  fs.mkdirSync(dataDir, { recursive: true });
  const tempFile = dataFile + ".tmp";
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
  fs.renameSync(tempFile, dataFile);
}
function defaults() {
  return {
    welcome: { enabled: false, channelId: "", message: "Willkommen {user} auf {server}!", title: "Willkommen!", color: "#22d3ee", mentionUser: true },
    tickets: { enabled: false, categoryId: "", supportRoleId: "", panelChannelId: "", panelTitle: "Support benötigt?", panelDescription: "Klicke auf die Schaltfläche, um ein privates Support-Ticket zu erstellen.", buttonLabel: "Ticket erstellen", color: "#22d3ee" },
    autorole: { enabled: false, roleId: "" },
    selfroles: { enabled: false, channelId: "", roles: [], panelTitle: "Deine Rollen", panelDescription: "Wähle die Rollen aus, die du haben möchtest. Entferne die Auswahl, um eine Rolle wieder abzugeben.", placeholder: "Wähle deine Rollen" },
    automod: { enabled: false, logChannelId: "", threshold: 0.82, action: "delete_warn" },
    voiceMaster: { enabled: false, joinChannelId: "", categoryId: "", nameTemplate: "Raum von {username}", userLimit: 0 },
    antiSpam: { enabled: false, maxMessages: 5, intervalSeconds: 6, action: "delete_warn" },
    antiLinks: { enabled: false, allowedChannelId: "", action: "delete_warn" },
    giveaways: { enabled: false, channelId: "" }
  };
}
function normalizeSettings(input) {
  const base = defaults();
  const value = input && typeof input === "object" ? input : {};
  const stringValue = (v, max = 100) => typeof v === "string" ? v.trim().slice(0, max) : "";
  const roles = Array.isArray(value.selfroles?.roles)
    ? value.selfroles.roles.slice(0, 25).map(role => ({ id: stringValue(role?.id, 24), label: stringValue(role?.label, 80) })).filter(role => /^\d{17,20}$/.test(role.id) && role.label)
    : [];
  return {
    welcome: {
      enabled: value.welcome?.enabled === true || value.welcome === true,
      channelId: stringValue(value.welcome?.channelId, 24),
      message: stringValue(value.welcome?.message, 500) || base.welcome.message,
      title: stringValue(value.welcome?.title, 100),
      color: /^#[0-9a-fA-F]{6}$/.test(value.welcome?.color || "") ? value.welcome.color : base.welcome.color,
      mentionUser: value.welcome?.mentionUser !== false
    },
    tickets: {
      enabled: value.tickets?.enabled === true || value.tickets === true,
      categoryId: stringValue(value.tickets?.categoryId, 24),
      supportRoleId: stringValue(value.tickets?.supportRoleId, 24),
      panelChannelId: stringValue(value.tickets?.panelChannelId, 24),
      panelTitle: stringValue(value.tickets?.panelTitle, 100) || base.tickets.panelTitle,
      panelDescription: stringValue(value.tickets?.panelDescription, 1000) || base.tickets.panelDescription,
      buttonLabel: stringValue(value.tickets?.buttonLabel, 80) || base.tickets.buttonLabel,
      color: /^#[0-9a-fA-F]{6}$/.test(value.tickets?.color || "") ? value.tickets.color : base.tickets.color
    },
    autorole: { enabled: value.autorole?.enabled === true, roleId: stringValue(value.autorole?.roleId, 24) },
    selfroles: {
      enabled: value.selfroles?.enabled === true, channelId: stringValue(value.selfroles?.channelId, 24), roles,
      panelTitle: stringValue(value.selfroles?.panelTitle, 100) || base.selfroles.panelTitle,
      panelDescription: stringValue(value.selfroles?.panelDescription, 1000) || base.selfroles.panelDescription,
      placeholder: stringValue(value.selfroles?.placeholder, 100) || base.selfroles.placeholder
    },
    automod: {
      enabled: value.automod?.enabled === true || value.automod === true,
      logChannelId: stringValue(value.automod?.logChannelId, 24),
      threshold: typeof value.automod?.threshold === "number" ? Math.min(0.99, Math.max(0.5, value.automod.threshold)) : base.automod.threshold,
      action: value.automod?.action === "delete" ? "delete" : "delete_warn"
    },
    voiceMaster: {
      enabled: value.voiceMaster?.enabled === true,
      joinChannelId: stringValue(value.voiceMaster?.joinChannelId, 24),
      categoryId: stringValue(value.voiceMaster?.categoryId, 24),
      nameTemplate: stringValue(value.voiceMaster?.nameTemplate, 80) || base.voiceMaster.nameTemplate,
      userLimit: Math.min(99, Math.max(0, Number(value.voiceMaster?.userLimit) || 0))
    },
    antiSpam: {
      enabled: value.antiSpam?.enabled === true,
      maxMessages: Math.min(15, Math.max(2, Number(value.antiSpam?.maxMessages) || base.antiSpam.maxMessages)),
      intervalSeconds: Math.min(30, Math.max(2, Number(value.antiSpam?.intervalSeconds) || base.antiSpam.intervalSeconds)),
      action: value.antiSpam?.action === "delete" ? "delete" : "delete_warn"
    },
    antiLinks: {
      enabled: value.antiLinks?.enabled === true,
      allowedChannelId: stringValue(value.antiLinks?.allowedChannelId, 24),
      action: value.antiLinks?.action === "delete" ? "delete" : "delete_warn"
    },
    giveaways: {
      enabled: value.giveaways?.enabled === true,
      channelId: stringValue(value.giveaways?.channelId, 24)
    }
  };
}
function getGuildSettings(guildId) {
  const all = readAll();
  const normalized = normalizeSettings(all[guildId]);
  if (!all[guildId] || JSON.stringify(all[guildId]) !== JSON.stringify(normalized)) { all[guildId] = normalized; writeAll(all); }
  return normalized;
}
function setGuildSettings(guildId, settings) {
  const all = readAll(); const normalized = normalizeSettings(settings); all[guildId] = normalized; writeAll(all); return normalized;
}
function setGuildModule(guildId, moduleName, enabled) {
  const current = getGuildSettings(guildId);
  if (!["welcome", "tickets", "autorole", "selfroles", "automod", "voiceMaster", "antiSpam", "antiLinks", "giveaways"].includes(moduleName)) throw new Error("Unknown module");
  current[moduleName].enabled = enabled;
  return setGuildSettings(guildId, current);
}
module.exports = { getGuildSettings, setGuildSettings, setGuildModule };
