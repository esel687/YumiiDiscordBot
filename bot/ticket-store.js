const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "tickets.json");

function createId() {
  return crypto.randomBytes(12).toString("hex");
}

function readAll() {
  try {
    if (!fs.existsSync(dataFile)) return { settings: {}, panels: {}, categories: {}, snippets: {}, automations: {}, tickets: {}, closeRequests: {}, addRequests: {} };
    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return {
      settings: data.settings || {},
      panels: data.panels || {},
      categories: data.categories || {},
      snippets: data.snippets || {},
      automations: data.automations || {},
      tickets: data.tickets || {},
      closeRequests: data.closeRequests || {},
      addRequests: data.addRequests || {}
    };
  } catch (error) {
    console.error("Ticket-Daten konnten nicht gelesen werden:", error);
    throw new Error("Die Ticket-Daten konnten nicht geladen werden.");
  }
}

function writeAll(data) {
  fs.mkdirSync(dataDir, { recursive: true });
  const temporaryFile = dataFile + ".tmp";
  fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporaryFile, dataFile);
}

function cleanString(value, maxLength, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

function defaultPanel(guildId, name, position = 0) {
  const now = new Date().toISOString();
  return {
    id: createId(),
    guildId,
    name: cleanString(name, 50, "Neues Panel") || "Neues Panel",
    channelId: "",
    messageId: "",
    openLimitPerUser: 0,
    pingTeam: true,
    channelNamePattern: "ticket-%TICKET_NUMBER%",
    channelNamePreset: "ticket-%TICKET_NUMBER%",
    showWorkload: true,
    onlyTeamCanClose: true,
    closeRequestNeedsClaim: true,
    creatorsCanAddUsers: false,
    onCreatorLeave: "nothing",
    panelMessage: {
      title: "Support",
      description: "Hier kannst du ein Ticket erstellen. Wähle unten eine Kategorie aus.",
      thumbnailUrl: "",
      imageUrl: "",
      buttonLabel: "Ticket erstellen",
      buttonEmoji: "🎫"
    },
    welcomeMessage: {
      title: "Dein Ticket wurde erfolgreich erstellt",
      description: "Ein Teammitglied wird sich demnächst um dich kümmern.",
      thumbnailUrl: "",
      imageUrl: ""
    },
    position,
    createdAt: now,
    updatedAt: now
  };
}

function getGuildData(guildId) {
  const data = readAll();
  return {
    settings: data.settings[guildId] || { guildId, enabled: true, logChannelId: "", ticketCounter: 0 },
    panels: Object.values(data.panels).filter(panel => panel.guildId === guildId).sort((a, b) => a.position - b.position),
    categories: Object.values(data.categories).filter(category => category.guildId === guildId),
    snippets: Object.values(data.snippets).filter(snippet => snippet.guildId === guildId),
    automations: Object.values(data.automations).filter(automation => automation.guildId === guildId)
  };
}

function updateSettings(guildId, patch) {
  const data = readAll();
  const current = data.settings[guildId] || { guildId, enabled: true, logChannelId: "", ticketCounter: 0 };
  const next = { ...current };
  if (typeof patch.enabled === "boolean") next.enabled = patch.enabled;
  if (typeof patch.logChannelId === "string" && /^\d{17,20}$/.test(patch.logChannelId)) next.logChannelId = patch.logChannelId;
  else if (patch.logChannelId === "") next.logChannelId = "";
  next.updatedAt = new Date().toISOString();
  data.settings[guildId] = next;
  writeAll(data);
  return next;
}

function createPanel(guildId) {
  const data = readAll();
  const panels = Object.values(data.panels).filter(panel => panel.guildId === guildId);
  if (panels.length >= 10) throw new Error("Maximal 10 Panels pro Server.");
  let name = "Neues Panel";
  let suffix = 2;
  const names = new Set(panels.map(panel => panel.name.toLocaleLowerCase("de")));
  while (names.has(name.toLocaleLowerCase("de"))) {
    name = "Neues Panel " + suffix;
    suffix += 1;
  }
  const panel = defaultPanel(guildId, name, panels.length);
  data.panels[panel.id] = panel;
  writeAll(data);
  return panel;
}

function getPanel(guildId, panelId) {
  const data = readAll();
  const panel = data.panels[panelId];
  if (!panel || panel.guildId !== guildId) return null;
  return {
    ...panel,
    categories: Object.values(data.categories).filter(item => item.panelId === panelId).sort((a, b) => a.position - b.position),
    snippets: Object.values(data.snippets).filter(item => item.panelId === panelId).sort((a, b) => a.name.localeCompare(b.name, "de")),
    automations: Object.values(data.automations).filter(item => item.panelId === panelId)
  };
}

function updatePanel(guildId, panelId, patch) {
  const data = readAll();
  const panel = data.panels[panelId];
  if (!panel || panel.guildId !== guildId) return null;
  const allowed = [
    "name", "channelId", "openLimitPerUser", "pingTeam", "channelNamePattern", "channelNamePreset",
    "showWorkload", "onlyTeamCanClose", "closeRequestNeedsClaim", "creatorsCanAddUsers",
    "onCreatorLeave", "panelMessage", "welcomeMessage"
  ];
  const next = { ...panel };
  for (const key of allowed) {
    if (patch[key] !== undefined) next[key] = patch[key];
  }
  next.name = cleanString(next.name, 50) || panel.name;
  next.openLimitPerUser = Math.min(25, Math.max(0, Math.floor(Number(next.openLimitPerUser) || 0)));
  next.channelNamePattern = cleanString(next.channelNamePattern, 100, panel.channelNamePattern);
  next.pingTeam = next.pingTeam !== false;
  next.showWorkload = next.showWorkload !== false;
  next.onlyTeamCanClose = next.onlyTeamCanClose !== false;
  next.closeRequestNeedsClaim = next.closeRequestNeedsClaim !== false;
  next.creatorsCanAddUsers = next.creatorsCanAddUsers === true;
  next.onCreatorLeave = ["nothing", "close", "delete"].includes(next.onCreatorLeave) ? next.onCreatorLeave : "nothing";
  for (const field of ["panelMessage", "welcomeMessage"]) {
    if (patch[field] && typeof patch[field] === "object") {
      next[field] = { ...panel[field], ...patch[field] };
      next[field].title = cleanString(next[field].title, 256);
      next[field].description = cleanString(next[field].description, field === "panelMessage" ? 3800 : 4000);
      next[field].thumbnailUrl = cleanString(next[field].thumbnailUrl, 500);
      next[field].imageUrl = cleanString(next[field].imageUrl, 500);
      for (const key of ["thumbnailUrl", "imageUrl"]) {
        if (next[field][key] && !/^https:\/\//i.test(next[field][key])) throw new Error("Bild-URLs müssen mit https:// beginnen.");
      }
    }
  }
  next.updatedAt = new Date().toISOString();
  data.panels[panelId] = next;
  writeAll(data);
  return next;
}

function deletePanel(guildId, panelId) {
  const data = readAll();
  const panel = data.panels[panelId];
  if (!panel || panel.guildId !== guildId) return false;
  delete data.panels[panelId];
  for (const [id, item] of Object.entries(data.categories)) if (item.panelId === panelId) delete data.categories[id];
  for (const [id, item] of Object.entries(data.snippets)) if (item.panelId === panelId) delete data.snippets[id];
  for (const [id, item] of Object.entries(data.automations)) if (item.panelId === panelId) delete data.automations[id];
  writeAll(data);
  return panel;
}

function createCategory(guildId, panelId, input = {}) {
  const data = readAll();
  const panel = data.panels[panelId];
  if (!panel || panel.guildId !== guildId) throw new Error("Ticket-Panel wurde nicht gefunden.");
  const existing = Object.values(data.categories).filter(item => item.panelId === panelId);
  if (existing.length >= 25) throw new Error("Maximal 25 Kategorien pro Panel.");
  const name = cleanString(input.name, 50);
  if (!name) throw new Error("Bitte gib einen Kategorienamen ein.");
  const item = {
    id: createId(), guildId, panelId, name,
    emoji: cleanString(input.emoji, 32, "🎫"),
    description: cleanString(input.description, 100),
    prefix: cleanString(input.prefix, 20).toLowerCase().replace(/[^a-z0-9-]/g, ""),
    teamRoleIds: Array.isArray(input.teamRoleIds) ? input.teamRoleIds.filter(id => /^\d{17,20}$/.test(id)).slice(0, 25) : [],
    teamUserIds: Array.isArray(input.teamUserIds) ? input.teamUserIds.filter(id => /^\d{17,20}$/.test(id)).slice(0, 25) : [],
    discordCategoryId: cleanString(input.discordCategoryId, 24),
    customWelcome: input.customWelcome && typeof input.customWelcome === "object" ? input.customWelcome : null,
    workloadLimit: Math.min(500, Math.max(0, Math.floor(Number(input.workloadLimit) || 0))),
    formQuestions: Array.isArray(input.formQuestions) ? input.formQuestions.slice(0, 5) : [],
    channelNamePattern: cleanString(input.channelNamePattern, 100),
    pingTeamOverride: ["inherit", "yes", "no"].includes(input.pingTeamOverride) ? input.pingTeamOverride : "inherit",
    position: existing.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.categories[item.id] = item;
  writeAll(data);
  return item;
}

function updateCategory(guildId, categoryId, patch) {
  const data = readAll();
  const item = data.categories[categoryId];
  if (!item || item.guildId !== guildId) return null;
  const next = { ...item };
  for (const key of ["name", "emoji", "description", "prefix", "teamRoleIds", "teamUserIds", "discordCategoryId", "customWelcome", "workloadLimit", "formQuestions", "channelNamePattern", "pingTeamOverride", "position"]) {
    if (patch[key] !== undefined) next[key] = patch[key];
  }
  next.name = cleanString(next.name, 50) || item.name;
  next.description = cleanString(next.description, 100);
  next.prefix = cleanString(next.prefix, 20).toLowerCase().replace(/[^a-z0-9-]/g, "");
  next.workloadLimit = Math.min(500, Math.max(0, Math.floor(Number(next.workloadLimit) || 0)));
  next.formQuestions = Array.isArray(next.formQuestions) ? next.formQuestions.slice(0, 5).map(question => ({
    label: cleanString(question.label, 45),
    placeholder: cleanString(question.placeholder, 100),
    style: question.style === "paragraph" ? "paragraph" : "short",
    required: question.required !== false,
    minLength: Math.min(4000, Math.max(0, Number(question.minLength) || 0)),
    maxLength: Math.min(4000, Math.max(1, Number(question.maxLength) || 1000))
  })) : [];
  next.updatedAt = new Date().toISOString();
  data.categories[categoryId] = next;
  writeAll(data);
  return next;
}

function deleteCategory(guildId, categoryId) {
  const data = readAll();
  const item = data.categories[categoryId];
  if (!item || item.guildId !== guildId) return false;
  delete data.categories[categoryId];
  writeAll(data);
  return true;
}

function saveSnippet(guildId, panelId, input, snippetId = null) {
  const data = readAll();
  const panel = data.panels[panelId];
  if (!panel || panel.guildId !== guildId) throw new Error("Ticket-Panel wurde nicht gefunden.");
  const existing = Object.values(data.snippets).filter(item => item.panelId === panelId);
  if (!snippetId && existing.length >= 25) throw new Error("Maximal 25 Textbausteine pro Panel.");
  if (snippetId && (!data.snippets[snippetId] || data.snippets[snippetId].guildId !== guildId || data.snippets[snippetId].panelId !== panelId)) throw new Error("Textbaustein wurde nicht gefunden.");
  const name = cleanString(input.name, 50);
  const content = cleanString(input.content, 4000);
  if (!name || !content) throw new Error("Name und Inhalt sind Pflichtfelder.");
  const id = snippetId || createId();
  const item = { ...(data.snippets[id] || {}), id, guildId, panelId, name, type: input.type === "embed" ? "embed" : "message", content, title: cleanString(input.title, 256), thumbnailUrl: cleanString(input.thumbnailUrl, 500), imageUrl: cleanString(input.imageUrl, 500), updatedAt: new Date().toISOString() };
  data.snippets[id] = item;
  writeAll(data);
  return item;
}

function deleteSnippet(guildId, snippetId) {
  const data = readAll();
  const item = data.snippets[snippetId];
  if (!item || item.guildId !== guildId) return false;
  delete data.snippets[snippetId];
  writeAll(data);
  return true;
}

function setAutomation(guildId, panelId, type, config) {
  const allowed = ["autoClose", "teamReminder", "transcript", "rating", "grantRole"];
  if (!allowed.includes(type)) throw new Error("Unbekannter Ablauf.");
  const data = readAll();
  const panel = data.panels[panelId];
  if (!panel || panel.guildId !== guildId) throw new Error("Ticket-Panel wurde nicht gefunden.");
  const id = panelId + ":" + type;
  const current = data.automations[id] || { id, guildId, panelId, type, enabled: false, config: {} };
  const next = { ...current, enabled: config?.enabled === true, config: config?.config && typeof config.config === "object" ? config.config : {} };
  data.automations[id] = next;
  writeAll(data);
  return next;
}

function nextTicketNumber(guildId) {
  const data = readAll();
  const settings = data.settings[guildId] || { guildId, enabled: true, logChannelId: "", ticketCounter: 0 };
  settings.ticketCounter = Number(settings.ticketCounter || 0) + 1;
  data.settings[guildId] = settings;
  writeAll(data);
  return settings.ticketCounter;
}

function createTicket(input) {
  const data = readAll();
  const ticket = { id: createId(), addedUserIds: [], status: "open", createdAt: new Date().toISOString(), ...input };
  data.tickets[ticket.id] = ticket;
  writeAll(data);
  return ticket;
}

function getTicketByChannel(channelId) {
  return Object.values(readAll().tickets).find(ticket => ticket.channelId === channelId) || null;
}

function updateTicket(ticketId, patch) {
  const data = readAll();
  const ticket = data.tickets[ticketId];
  if (!ticket) return null;
  data.tickets[ticketId] = { ...ticket, ...patch };
  writeAll(data);
  return data.tickets[ticketId];
}

function listOpenTickets(guildId, panelId, creatorId = null, categoryId = null) {
  return Object.values(readAll().tickets).filter(ticket =>
    ticket.guildId === guildId && ticket.status === "open" &&
    (!panelId || ticket.panelId === panelId) &&
    (!creatorId || ticket.creatorId === creatorId) &&
    (!categoryId || ticket.categoryId === categoryId)
  );
}

module.exports = {
  createId, getGuildData, updateSettings, createPanel, getPanel, updatePanel, deletePanel,
  createCategory, updateCategory, deleteCategory, saveSnippet, deleteSnippet, setAutomation,
  nextTicketNumber, createTicket, getTicketByChannel, updateTicket, listOpenTickets
};
