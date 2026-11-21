const http = require("node:http");
const { timingSafeEqual } = require("node:crypto");
const { getGuildSettings, setGuildSettings } = require("./config-store");

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
    const match = /^\/guilds\/(\d{17,20})\/(settings|resources)$/.exec((req.url || "").split("?")[0]);
    if (!match) return send(res, 404, { error: "Not found" });
    const guildId = match[1];
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
