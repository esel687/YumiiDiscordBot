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
    selfroles: { enabled: false, channelId: "", roles: [], panelTitle: "Deine Rollen", panelDescription: "Wähle die Rollen aus, die du haben möchtest. Entferne die Auswahl, um eine Rolle wieder abzugeben.", placeholder: "Wähle deine Rollen" },
    automod: { enabled: false, logChannelId: "", threshold: 0.82, action: "delete_warn" },
    leave: { enabled: false, channelId: "", message: "{username} hat den Server verlassen. Tschüss!" },
    suggestions: { enabled: false, channelId: "", reviewChannelId: "", title: "Neuer Vorschlag", color: "#22d3ee" },
    starboard: { enabled: false, channelId: "", threshold: 3, emoji: "⭐" },
    antiInvite: { enabled: false, action: "delete_warn", allowedChannelId: "" },
    antiSpam: { enabled: false, maxMessages: 5, intervalSeconds: 6, action: "delete_warn" },
    antiCaps: { enabled: false, minLength: 12, percentage: 75, action: "delete_warn" },
    antiLinks: { enabled: false, action: "delete_warn", allowedChannelId: "" },
    keywordFilter: { enabled: false, words: [], action: "delete_warn", logChannelId: "" },
    slowmode: { enabled: false, channelId: "", seconds: 5 },
    counting: { enabled: false, channelId: "", startNumber: 1, lastNumber: 0 },
    polls: { enabled: false, channelId: "" },
    giveaways: { enabled: false, channelId: "" },
    logs: { enabled: false, channelId: "", messageDelete: true, messageEdit: true, memberJoin: true, memberLeave: true }
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
    selfroles: { enabled: value.selfroles?.enabled === true, channelId: stringValue(value.selfroles?.channelId, 24), roles, panelTitle: stringValue(value.selfroles?.panelTitle, 100) || base.selfroles.panelTitle, panelDescription: stringValue(value.selfroles?.panelDescription, 1000) || base.selfroles.panelDescription, placeholder: stringValue(value.selfroles?.placeholder, 100) || base.selfroles.placeholder },
    automod: {
      enabled: value.automod?.enabled === true || value.automod === true,
      logChannelId: stringValue(value.automod?.logChannelId, 24),
      threshold: typeof value.automod?.threshold === "number" ? Math.min(0.99, Math.max(0.5, value.automod.threshold)) : base.automod.threshold,
      action: value.automod?.action === "delete" ? "delete" : "delete_warn"
    },
    leave: { enabled: value.leave?.enabled === true, channelId: stringValue(value.leave?.channelId, 24), message: stringValue(value.leave?.message, 500) || base.leave.message },
    suggestions: {
      enabled: value.suggestions?.enabled === true,
      channelId: stringValue(value.suggestions?.channelId, 24),
      reviewChannelId: stringValue(value.suggestions?.reviewChannelId, 24),
      title: stringValue(value.suggestions?.title, 100) || base.suggestions.title,
      color: /^#[0-9a-fA-F]{6}$/.test(value.suggestions?.color || "") ? value.suggestions.color : base.suggestions.color
    },
    starboard: {
      enabled: value.starboard?.enabled === true,
      channelId: stringValue(value.starboard?.channelId, 24),
      threshold: Math.min(20, Math.max(1, Number(value.starboard?.threshold) || base.starboard.threshold)),
      emoji: stringValue(value.starboard?.emoji, 8) || base.starboard.emoji
    },
    antiInvite: {
      enabled: value.antiInvite?.enabled === true,
      action: value.antiInvite?.action === "delete" ? "delete" : "delete_warn",
      allowedChannelId: stringValue(value.antiInvite?.allowedChannelId, 24)
    },
    antiSpam: {
      enabled: value.antiSpam?.enabled === true,
      maxMessages: Math.min(15, Math.max(2, Number(value.antiSpam?.maxMessages) || 5)),
      intervalSeconds: Math.min(30, Math.max(2, Number(value.antiSpam?.intervalSeconds) || 6)),
      action: value.antiSpam?.action === "delete" ? "delete" : "delete_warn"
    },
    antiCaps: {
      enabled: value.antiCaps?.enabled === true,
      minLength: Math.min(100, Math.max(5, Number(value.antiCaps?.minLength) || 12)),
      percentage: Math.min(100, Math.max(50, Number(value.antiCaps?.percentage) || 75)),
      action: value.antiCaps?.action === "delete" ? "delete" : "delete_warn"
    },
    antiLinks: {
      enabled: value.antiLinks?.enabled === true,
      action: value.antiLinks?.action === "delete" ? "delete" : "delete_warn",
      allowedChannelId: stringValue(value.antiLinks?.allowedChannelId, 24)
    },
    keywordFilter: {
      enabled: value.keywordFilter?.enabled === true,
      words: Array.isArray(value.keywordFilter?.words) ? value.keywordFilter.words.slice(0, 100).map(word => stringValue(word, 50)).filter(Boolean) : [],
      action: value.keywordFilter?.action === "delete" ? "delete" : "delete_warn",
      logChannelId: stringValue(value.keywordFilter?.logChannelId, 24)
    },
    slowmode: {
      enabled: value.slowmode?.enabled === true,
      channelId: stringValue(value.slowmode?.channelId, 24),
      seconds: Math.min(21600, Math.max(0, Number(value.slowmode?.seconds) || 5))
    },
    counting: {
      enabled: value.counting?.enabled === true,
      channelId: stringValue(value.counting?.channelId, 24),
      startNumber: Math.max(1, Number(value.counting?.startNumber) || 1),
      lastNumber: Math.max(0, Number(value.counting?.lastNumber) || 0)
    },
    polls: {
      enabled: value.polls?.enabled === true,
      channelId: stringValue(value.polls?.channelId, 24)
    },
    giveaways: {
      enabled: value.giveaways?.enabled === true,
      channelId: stringValue(value.giveaways?.channelId, 24)
    },
    logs: {
      enabled: value.logs?.enabled === true || value.logs === true,
      channelId: stringValue(value.logs?.channelId, 24),
      messageDelete: value.logs?.messageDelete !== false,
      messageEdit: value.logs?.messageEdit !== false,
      memberJoin: value.logs?.memberJoin !== false,
      memberLeave: value.logs?.memberLeave !== false
    }
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
  if (!["welcome", "tickets", "autorole", "selfroles", "automod", "leave", "suggestions", "starboard", "antiInvite", "antiSpam", "antiCaps", "antiLinks", "keywordFilter", "slowmode", "counting", "polls", "giveaways", "logs"].includes(moduleName)) {
    throw new Error("Unknown module");
  }
  current[moduleName].enabled = enabled;
  return setGuildSettings(guildId, current);
}

module.exports = { getGuildSettings, setGuildSettings, setGuildModule };
