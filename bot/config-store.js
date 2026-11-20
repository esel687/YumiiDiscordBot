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
  return { welcome: false, tickets: false, automod: false, logs: false };
}

function getGuildSettings(guildId) {
  const all = readAll();
  if (!all[guildId]) {
    all[guildId] = defaults();
    writeAll(all);
  }
  return all[guildId];
}

function setGuildModule(guildId, moduleName, enabled) {
  const all = readAll();
  const current = all[guildId] || defaults();
  current[moduleName] = enabled;
  all[guildId] = current;
  writeAll(all);
  return current;
}

module.exports = { getGuildSettings, setGuildModule };
