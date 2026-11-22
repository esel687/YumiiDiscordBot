const http = require("node:http");
const { timingSafeEqual } = require("node:crypto");
const { getGuildSettings, setGuildSettings } = require("./config-store");
const ticketStore = require("./ticket-store");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
    "access-control-allow-origin": "null"
  });
  res.end(body);
}

function authorized(req) {
  const expected = process.env.MOONBOT_API_SECRET || "";
  const provided = req.headers["x-moonbot-secret"] || "";
  if (!expected || typeof provided !== "string") return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 65536) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function startControlServer(client) {
  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      return send(res, 200, { ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
    }
    if (!authorized(req)) return send(res, 401, { error: "Unauthorized" });
    const ticketPath = (req.url || "").split("?")[0];
    const ticketMatch = /^\/guilds\/(\d{17,20})\/ticket(?:\/(.*))?$/.exec(ticketPath);
    if (ticketMatch) {
      const guildId = ticketMatch[1];
      const parts = (ticketMatch[2] || "").split("/").filter(Boolean);
      try {
        const memberGuild = await client.guilds.fetch(guildId).catch(() => null);
        if (!memberGuild) return send(res, 404, { ok: false, error: "MoonBot ist nicht auf diesem Discord-Server." });
        if (parts.length === 0 && req.method === "GET") return send(res, 200, { ok: true, data: ticketStore.getGuildData(guildId) });
        if (parts.length === 0 && req.method === "PATCH") {
          const body = await readBody(req);
          return send(res, 200, { ok: true, data: ticketStore.updateSettings(guildId, body) });
        }
        if (parts[0] === "panels" && parts.length === 1 && req.method === "POST") {
          return send(res, 201, { ok: true, data: ticketStore.createPanel(guildId) });
        }
        if (parts[0] === "panels" && parts.length === 2 && req.method === "GET") {
          const panel = ticketStore.getPanel(guildId, parts[1]);
          return panel ? send(res, 200, { ok: true, data: panel }) : send(res, 404, { ok: false, error: "Ticket-Panel wurde nicht gefunden." });
        }
        if (parts[0] === "panels" && parts.length === 2 && req.method === "PATCH") {
          const panel = ticketStore.updatePanel(guildId, parts[1], await readBody(req));
          return panel ? send(res, 200, { ok: true, data: panel }) : send(res, 404, { ok: false, error: "Ticket-Panel wurde nicht gefunden." });
        }
        if (parts[0] === "panels" && parts.length === 2 && req.method === "DELETE") {
          const panel = ticketStore.deletePanel(guildId, parts[1]);
          if (!panel) return send(res, 404, { ok: false, error: "Ticket-Panel wurde nicht gefunden." });
          if (panel.channelId && panel.messageId) {
            const channel = await client.channels.fetch(panel.channelId).catch(() => null);
            const message = channel?.isTextBased() ? await channel.messages.fetch(panel.messageId).catch(() => null) : null;
            if (message) await message.delete().catch(() => {});
          }
          return send(res, 200, { ok: true, data: { deleted: true } });
        }
        if (parts[0] === "panels" && parts.length === 3 && parts[2] === "send" && req.method === "POST") {
          const panel = ticketStore.getPanel(guildId, parts[1]);
          if (!panel) return send(res, 404, { ok: false, error: "Ticket-Panel wurde nicht gefunden." });
          const settings = ticketStore.getGuildData(guildId).settings;
          if (!settings.enabled) return send(res, 409, { ok: false, error: "Das Ticket-System ist aktuell deaktiviert." });
          if (!panel.categories.length) return send(res, 400, { ok: false, error: "Bitte erstelle zuerst mindestens eine Kategorie." });
          if (!panel.channelId) return send(res, 400, { ok: false, error: "Bitte wähle einen Kanal für das Ticket-Panel." });
          const guild = await client.guilds.fetch(guildId).catch(() => null);
          const channel = guild ? await guild.channels.fetch(panel.channelId).catch(() => null) : null;
          if (!channel?.isTextBased() || !channel.messages) return send(res, 404, { ok: false, error: "Der ausgewählte Panel-Kanal wurde nicht gefunden." });
          const botMember = guild.members.me;
          const permissions = channel.permissionsFor(botMember);
          if (!permissions?.has(["SendMessages", "EmbedLinks", "ViewChannel"])) return send(res, 403, { ok: false, error: "Der Bot hat in diesem Kanal keine Berechtigung zum Senden von Nachrichten und Embeds." });
          const embed = new EmbedBuilder().setColor(0x36d6d0)
            .setTitle(panel.panelMessage.title || panel.name)
            .setDescription((panel.panelMessage.description || "").replaceAll("{server}", guild.name).replaceAll("{panel}", panel.name));
          if (panel.panelMessage.thumbnailUrl) embed.setThumbnail(panel.panelMessage.thumbnailUrl);
          if (panel.panelMessage.imageUrl) embed.setImage(panel.panelMessage.imageUrl);
          let components;
          if (panel.categories.length === 1) {
            components = [new ActionRowBuilder().addComponents(new ButtonBuilder()
              .setCustomId("ticket:open:" + panel.id)
              .setLabel(panel.panelMessage.buttonLabel || "Ticket erstellen")
              .setEmoji(panel.panelMessage.buttonEmoji || "🎫")
              .setStyle(ButtonStyle.Primary))];
          } else {
            const menu = new StringSelectMenuBuilder().setCustomId("ticket:select:" + panel.id)
              .setPlaceholder("Wähle eine Kategorie")
              .addOptions(panel.categories.slice(0, 25).map(category => ({
                label: category.name.slice(0, 100),
                value: category.id,
                description: (category.description || "Ticket erstellen").slice(0, 100),
                ...(category.emoji ? { emoji: category.emoji } : {})
              })));
            components = [new ActionRowBuilder().addComponents(menu)];
          }
          let message = null;
          if (panel.channelId && panel.messageId) {
            const oldChannel = await client.channels.fetch(panel.channelId).catch(() => null);
            if (oldChannel?.id === channel.id && oldChannel.isTextBased()) {
              message = await oldChannel.messages.fetch(panel.messageId).catch(() => null);
            } else if (oldChannel?.isTextBased()) {
              const oldMessage = await oldChannel.messages.fetch(panel.messageId).catch(() => null);
              if (oldMessage) await oldMessage.delete().catch(() => {});
            }
          }
          if (message) await message.edit({ embeds: [embed], components });
          else message = await channel.send({ embeds: [embed], components });
          ticketStore.updatePanel(guildId, panel.id, { channelId: channel.id, messageId: message.id });
          return send(res, 200, { ok: true, data: { messageId: message.id, channelId: channel.id, url: message.url } });
        }
        if (parts[0] === "panels" && parts[2] === "categories" && parts.length === 3 && req.method === "POST") {
          return send(res, 201, { ok: true, data: ticketStore.createCategory(guildId, parts[1], await readBody(req)) });
        }
        if (parts[0] === "categories" && parts.length === 2 && req.method === "PATCH") {
          const item = ticketStore.updateCategory(guildId, parts[1], await readBody(req));
          return item ? send(res, 200, { ok: true, data: item }) : send(res, 404, { ok: false, error: "Ticket-Kategorie wurde nicht gefunden." });
        }
        if (parts[0] === "categories" && parts.length === 2 && req.method === "DELETE") {
          return ticketStore.deleteCategory(guildId, parts[1]) ? send(res, 200, { ok: true, data: { deleted: true } }) : send(res, 404, { ok: false, error: "Ticket-Kategorie wurde nicht gefunden." });
        }
        if (parts[0] === "panels" && parts[2] === "snippets" && parts.length === 3 && req.method === "POST") {
          return send(res, 201, { ok: true, data: ticketStore.saveSnippet(guildId, parts[1], await readBody(req)) });
        }
        if (parts[0] === "snippets" && parts.length === 2 && req.method === "PATCH") {
          const body = await readBody(req);
          const current = ticketStore.getGuildData(guildId).snippets.find(item => item.id === parts[1]);
          if (!current) return send(res, 404, { ok: false, error: "Textbaustein wurde nicht gefunden." });
          return send(res, 200, { ok: true, data: ticketStore.saveSnippet(guildId, current.panelId, body, parts[1]) });
        }
        if (parts[0] === "snippets" && parts.length === 2 && req.method === "DELETE") {
          return ticketStore.deleteSnippet(guildId, parts[1]) ? send(res, 200, { ok: true, data: { deleted: true } }) : send(res, 404, { ok: false, error: "Textbaustein wurde nicht gefunden." });
        }
        if (parts[0] === "panels" && parts[2] === "automations" && parts.length === 4 && req.method === "PUT") {
          const body = await readBody(req);
          return send(res, 200, { ok: true, data: ticketStore.setAutomation(guildId, parts[1], parts[3], body) });
        }
        return send(res, 404, { ok: false, error: "Ticket-API-Endpunkt wurde nicht gefunden." });
      } catch (error) {
        console.error("Ticket-API-Fehler:", error);
        return send(res, 400, { ok: false, error: error.message || "Die Ticket-Anfrage konnte nicht verarbeitet werden." });
      }
    }
    const match = /^\/guilds\/(\d{17,20})\/(settings|resources|actions\/ticket-panel)$/.exec((req.url || "").split("?")[0]);
    if (!match) return send(res, 404, { error: "Not found" });
    const guildId = match[1];
    if (req.method === "POST" && (req.url || "").split("?")[0] === `/guilds/${guildId}/actions/ticket-panel`) {
      const settings = getGuildSettings(guildId);
      if (settings.tickets?.enabled !== true) return send(res, 400, { error: "Aktiviere zuerst das Ticketsystem im Dashboard." });
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return send(res, 404, { error: "MoonBot ist nicht auf diesem Discord-Server." });
      const channelId = settings.tickets.panelChannelId;
      const target = channelId ? await guild.channels.fetch(channelId).catch(() => null) : null;
      if (!target?.isTextBased()) return send(res, 400, { error: "Wähle zuerst einen gültigen Ticket-Panel-Kanal aus." });
      const embed = new EmbedBuilder()
        .setColor(Number.parseInt((settings.tickets.color || "#22d3ee").slice(1), 16))
        .setTitle(settings.tickets.panelTitle || "Support benötigt?")
        .setDescription(settings.tickets.panelDescription || "Klicke auf die Schaltfläche, um ein privates Support-Ticket zu erstellen.");
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("moonbot:ticket:create").setLabel(settings.tickets.buttonLabel || "Ticket erstellen").setStyle(ButtonStyle.Primary).setEmoji("🎫")
      );
      try {
        const message = await target.send({ embeds: [embed], components: [row] });
        return send(res, 200, { ok: true, message: "Ticket-Panel wurde veröffentlicht.", channelId: target.id, messageId: message.id });
      } catch (error) {
        console.error("Ticket panel publish failed:", error);
        return send(res, 502, { error: "Discord hat das Panel nicht angenommen. Prüfe, ob MoonBot im Zielkanal Nachrichten und Links/Embeds senden darf." });
      }
    }
    if (req.method === "GET" && (req.url || "").split("?")[0] === `/guilds/${guildId}/resources`) {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return send(res, 404, { error: "Bot ist nicht auf diesem Server oder der Server wurde nicht gefunden." });
      try {
        const [channels, roles] = await Promise.all([guild.channels.fetch(), guild.roles.fetch()]);
        const channelItems = [...channels.values()]
          .filter(channel => channel && !channel.isThread())
          .map(channel => ({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            parentId: channel.parentId || "",
            position: channel.position ?? 0
          }))
          .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
        const roleItems = [...roles.values()]
          .filter(role => role && role.id !== guild.id && !role.managed)
          .sort((a, b) => b.position - a.position)
          .map(role => ({ id: role.id, name: role.name, color: role.hexColor, position: role.position }));
        return send(res, 200, { channels: channelItems, roles: roleItems });
      } catch (error) {
        console.error("Could not load Discord server resources:", error);
        return send(res, 502, { error: "Discord-Kanäle und Rollen konnten nicht geladen werden." });
      }
    }
    if (req.method === "GET") {
      return send(res, 200, {
        settings: getGuildSettings(guildId),
        aiConfigured: Boolean(process.env.OPENAI_API_KEY)
      });
    }
    if (req.method === "PUT") {
      try {
        const body = await readBody(req);
        const settings = setGuildSettings(guildId, body.settings);
        return send(res, 200, { settings, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
      } catch (error) {
        return send(res, 400, { error: error.message || "Invalid settings" });
      }
    }
    return send(res, 405, { error: "Method not allowed" });
  });

  const port = Number(process.env.SERVER_PORT || process.env.MOONBOT_API_PORT || process.env.PORT || 3001);
  server.listen(port, "0.0.0.0", () => {
    console.log(`MoonBot control API listening on port ${port}`);
  });
}

module.exports = { startControlServer };
