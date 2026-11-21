const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "guild-settings.json");

function readAll() {
  try {
    if (!fs.existsSync(dataFile)) return {};
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (error) {
    console.error("Could not read guild settings:", error);
    return {};
  }
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
    selfroles: { enabled: false, channelId: "", roles: [] },
    automod: { enabled: false, logChannelId: "", threshold: 0.82, action: "delete_warn" },
    logs: false
  };
}

function normalizeSettings(input) {
  const base = defaults();
  const value = input && typeof input === "object" ? input : {};
  const stringValue = (v, max = 100) => typeof v === "string" ? v.trim().slice(0, max) : "";
  const roles = Array.isArray(value.selfroles?.roles)
    ? value.selfroles.roles.slice(0, 25).map(role => ({
        id: stringValue(role?.id, 24),
        label: stringValue(role?.label, 80)
      })).filter(role => /^\d{17,20}$/.test(role.id) && role.label)
    : [];
  return {
    welcome: {
      enabled: value.welcome?.enabled === true || value.welcome === true,
      channelId: stringValue(value.welcome?.channelId, 24),
      message: stringValue(value.welcome?.message, 500) || base.welcome.message
    },
    tickets: {
      enabled: value.tickets?.enabled === true || value.tickets === true,
      categoryId: stringValue(value.tickets?.categoryId, 24),
      supportRoleId: stringValue(value.tickets?.supportRoleId, 24),
      panelChannelId: stringValue(value.tickets?.panelChannelId, 24)
    },
    autorole: {
      enabled: value.autorole?.enabled === true,
      roleId: stringValue(value.autorole?.roleId, 24)
    },
    selfroles: {
      enabled: value.selfroles?.enabled === true,
      channelId: stringValue(value.selfroles?.channelId, 24),
      roles
    },
    automod: {
      enabled: value.automod?.enabled === true || value.automod === true,
      logChannelId: stringValue(value.automod?.logChannelId, 24),
      threshold: typeof value.automod?.threshold === "number" ? Math.min(0.99, Math.max(0.5, value.automod.threshold)) : base.automod.threshold,
      action: value.automod?.action === "delete" ? "delete" : "delete_warn"
    },
    leave: { enabled: value.leave?.enabled === true, channelId: stringValue(value.leave?.channelId, 24), message: stringValue(value.leave?.message, 500) || base.leave.message },\n    suggestions: { enabled: value.suggestions?.enabled === true, channelId: stringValue(value.suggestions?.channelId, 24), reviewChannelId: stringValue(value.suggestions?.reviewChannelId, 24), title: stringValue(value.suggestions?.title, 100) || base.suggestions.title, color: /^#[0-9a-fA-F]{6}$/.test(value.suggestions?.color || "") ? value.suggestions.color : base.suggestions.color },\n    starboard: { enabled: value.starboard?.enabled === true, channelId: stringValue(value.starboard?.channelId, 24), threshold: Math.min(20, Math.max(1, Number(value.starboard?.threshold) || base.starboard.threshold)), emoji: stringValue(value.starboard?.emoji, 8) || base.starboard.emoji },\n    antiInvite: { enabled: value.antiInvite?.enabled === true, action: value.antiInvite?.action === "delete" ? "delete" : "delete_warn", allowedChannelId: stringValue(value.antiInvite?.allowedChannelId, 24) },\n    logs: { enabled: value.logs?.enabled === true || value.logs === true, channelId: stringValue(value.logs?.channelId, 24), messageDelete: value.logs?.messageDelete !== false, messageEdit: value.logs?.messageEdit !== false, memberJoin: value.logs?.memberJoin !== false, memberLeave: value.logs?.memberLeave !== false }
  };
}

function getGuildSettings(guildId) {
  const all = readAll();
  const normalized = normalizeSettings(all[guildId]);
  if (!all[guildId] || JSON.stringify(all[guildId]) !== JSON.stringify(normalized)) {
    all[guildId] = normalized;
    writeAll(all);
  }
  return normalized;
}

function setGuildSettings(guildId, settings) {
  const all = readAll();
  const normalized = normalizeSettings(settings);
  all[guildId] = normalized;
  writeAll(all);
  return normalized;
}

function setGuildModule(guildId, moduleName, enabled) {
  const current = getGuildSettings(guildId);
  if (!["welcome", "tickets", "autorole", "selfroles", "automod", "leave", "suggestions", "starboard", "antiInvite", "logs"].includes(moduleName)) {
    throw new Error("Unknown module");
  }
  if (moduleName === "logs") current.logs.enabled = enabled;
  else current[moduleName].enabled = enabled;
  return setGuildSettings(guildId, current);
}

module.exports = { getGuildSettings, setGuildSettings, setGuildModule };
