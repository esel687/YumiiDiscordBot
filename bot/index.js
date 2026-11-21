require("dotenv").config();
const {
  Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder,
  PermissionFlagsBits, EmbedBuilder, ChannelType, PermissionsBitField,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder
} = require("discord.js");
const { getGuildSettings, setGuildModule } = require("./config-store");
const { startControlServer } = require("./control-server");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
if (!token) {
  console.error("Missing DISCORD_TOKEN environment variable.");
  process.exit(1);
}
if (!clientId) {
  console.error("Missing DISCORD_CLIENT_ID environment variable.");
  process.exit(1);
}

const modules = ["welcome", "tickets", "autorole", "selfroles", "automod", "leave", "suggestions", "starboard", "antiInvite", "antiSpam", "antiCaps", "antiLinks", "keywordFilter", "slowmode", "counting", "polls", "giveaways", "logs"];
const moduleLabels = {
  welcome: "Willkommensnachrichten",
  tickets: "Ticketsystem",
  autorole: "Auto Role",
  selfroles: "Self Roles",
  automod: "KI-Auto-Mod",
  leave: "Abschiedsnachrichten",
  suggestions: "Vorschläge",
  starboard: "Starboard",
  antiInvite: "Anti-Discord-Links",
  antiSpam: "Anti-Spam",
  antiCaps: "Anti-Caps",
  antiLinks: "Anti-Links",
  keywordFilter: "Wortfilter",
  slowmode: "Auto-Slowmode",
  counting: "Zählspiel",
  polls: "Umfragen",
  giveaways: "Giveaways",
  logs: "Server-Logs"
};

const commands = [
  new SlashCommandBuilder()
    .setName("moonbot")
    .setDescription("MoonBot server tools")
    .addSubcommand(sub => sub.setName("status").setDescription("Zeigt die MoonBot-Einstellungen dieses Servers"))
    .addSubcommand(sub => sub
      .setName("module")
      .setDescription("Aktiviert oder deaktiviert ein MoonBot-Modul")
      .addStringOption(option => option.setName("name").setDescription("Modul").setRequired(true)
        .addChoices(...modules.map(name => ({ name: moduleLabels[name], value: name }))))
      .addBooleanOption(option => option.setName("enabled").setDescription("Aktivieren?").setRequired(true)))
    .addSubcommand(sub => sub.setName("ticket-panel").setDescription("Sendet ein Ticket-Erstellungs-Panel in diesen Kanal"))
    .addSubcommand(sub => sub.setName("selfroles-panel").setDescription("Sendet ein Self-Roles-Auswahlmenü in diesen Kanal"))
    .addSubcommand(sub => sub.setName("poll").setDescription("Erstellt eine Umfrage").addStringOption(option => option.setName("frage").setDescription("Deine Frage").setRequired(true).setMaxLength(250)))
    .addSubcommand(sub => sub.setName("giveaway").setDescription("Startet ein Giveaway").addStringOption(option => option.setName("preis").setDescription("Was wird verlost?").setRequired(true).setMaxLength(150)).addIntegerOption(option => option.setName("minuten").setDescription("Laufzeit in Minuten").setRequired(true).setMinValue(1).setMaxValue(10080)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON()
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [require("discord.js").Partials.Message, require("discord.js").Partials.Channel, require("discord.js").Partials.Reaction]
});

const recentMessages = new Map();
const countingLocks = new Set();

function moduleEnabled(settings, name) {
  return name === "logs" ? settings.logs?.enabled === true || settings.logs === true : settings[name]?.enabled === true;
}

async function moderateText(text, threshold = 0.82) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { available: false, flagged: false };
  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: "omni-moderation-latest", input: text.slice(0, 4000) }),
    signal: AbortSignal.timeout(7000)
  });
  if (!response.ok) throw new Error(`Moderation API returned ${response.status}`);
  const data = await response.json();
  const result = data.results?.[0];
  if (!result) return { available: true, flagged: false };
  const categories = result.categories || {};
  const scores = result.category_scores || {};
  const matches = (name) => categories[name] === true &&
    (scores[name] == null || scores[name] >= threshold);
  const threatening = matches("harassment/threatening") || matches("hate/threatening");
  const hate = matches("hate");
  const harassment = matches("harassment");
  return {
    available: true,
    flagged: harassment || hate || threatening,
    category: threatening ? "Drohung" : hate ? "Hassrede" : "Beleidigung oder Belästigung"
  };
}

async function sendModerationLog(guild, settings, message, reason) {
  const logId = settings.automod?.logChannelId;
  if (!logId) return;
  const channel = await guild.channels.fetch(logId).catch(() => null);
  if (!channel?.isTextBased()) return;
  const embed = new EmbedBuilder()
    .setColor(0xc084fc)
    .setTitle("MoonBot – KI-Auto-Mod")
    .setDescription("Eine Nachricht wurde wegen möglicher Beleidigung oder Belästigung entfernt.")
    .addFields(
      { name: "Mitglied", value: `${message.author.tag} (${message.author.id})`, inline: false },
      { name: "Kanal", value: `<#${message.channelId}>`, inline: true },
      { name: "Erkennung", value: reason, inline: true }
    )
    .setTimestamp();
  await channel.send({ embeds: [embed] }).catch(() => {});
}

async function sendServerLog(guild, settings, title, description) {
  const config = settings.logs || {};
  if (!moduleEnabled(settings, "logs") || !config.channelId) return;
  const channel = await guild.channels.fetch(config.channelId).catch(() => null);
  if (!channel?.isTextBased()) return;
  const embed = new EmbedBuilder().setColor(0x64748b).setTitle(title).setDescription(description.slice(0, 4000)).setTimestamp();
  await channel.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch(() => {});
}
client.once(Events.ClientReady, async readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  startControlServer(client);
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("MoonBot slash commands registered.");
  } catch (error) {
    console.error("Could not register slash commands:", error);
  }
});

client.on(Events.GuildCreate, guild => {
  getGuildSettings(guild.id);
  console.log(`Joined server: ${guild.name} (${guild.id})`);
});

client.on(Events.GuildMemberAdd, async member => {
  const settings = getGuildSettings(member.guild.id);
  if (settings.logs?.memberJoin !== false) await sendServerLog(member.guild, settings, "Mitglied beigetreten", `${member.user.tag} (${member.id}) ist dem Server beigetreten.`);

  if (moduleEnabled(settings, "autorole") && settings.autorole.roleId) {
    const role = await member.guild.roles.fetch(settings.autorole.roleId).catch(() => null);
    if (role && role.editable) {
      await member.roles.add(role, "MoonBot Auto Role").catch(error => console.error("Auto Role failed:", error));
    }
  }

  if (moduleEnabled(settings, "welcome") && settings.welcome.channelId) {
    const channel = await member.guild.channels.fetch(settings.welcome.channelId).catch(() => null);
    if (channel?.isTextBased()) {
      const message = (settings.welcome.message || "Willkommen {user} auf {server}!")
        .replaceAll("{user}", settings.welcome.mentionUser === false ? member.user.username : `<@${member.id}>`)
        .replaceAll("{username}", member.user.username)
        .replaceAll("{server}", member.guild.name);
      const embed = new EmbedBuilder().setColor(Number.parseInt((settings.welcome.color || "#22d3ee").slice(1), 16)).setDescription(message);
      if (settings.welcome.title) embed.setTitle(settings.welcome.title);
      await channel.send({ embeds: [embed], allowedMentions: settings.welcome.mentionUser === false ? { parse: [] } : { users: [member.id] } }).catch(error => console.error("Welcome message failed:", error));
    }
  }
});


client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot || !message.content?.trim()) return;
  const settings = getGuildSettings(message.guild.id);
  const config = settings;

  // Anti-spam: short rolling window per member and channel.
  if (moduleEnabled(config, "antiSpam")) {
    const key = `${message.guild.id}:${message.channelId}:${message.author.id}`;
    const now = Date.now();
    const recent = (recentMessages.get(key) || []).filter(time => now - time < config.antiSpam.intervalSeconds * 1000);
    recent.push(now);
    recentMessages.set(key, recent);
    if (recent.length > config.antiSpam.maxMessages) {
      await message.delete().catch(() => {});
      if (config.antiSpam.action !== "delete") {
        const warning = await message.channel.send({ content: `<@${message.author.id}> Bitte sende nicht so viele Nachrichten hintereinander.`, allowedMentions: { users: [message.author.id] } }).catch(() => null);
        if (warning) setTimeout(() => warning.delete().catch(() => {}), 7000);
      }
      return;
    }
  }

  // Anti-caps: ignore short messages and messages without letters.
  if (moduleEnabled(config, "antiCaps") && message.content.length >= config.antiCaps.minLength) {
    const letters = message.content.replace(/[^a-zA-ZäöüÄÖÜß]/g, "");
    if (letters.length >= config.antiCaps.minLength && letters.replace(/[^A-ZÄÖÜ]/g, "").length / letters.length * 100 >= config.antiCaps.percentage) {
      await message.delete().catch(() => {});
      if (config.antiCaps.action !== "delete") {
        const warning = await message.channel.send({ content: `<@${message.author.id}> Bitte vermeide Nachrichten in GROSSBUCHSTABEN.`, allowedMentions: { users: [message.author.id] } }).catch(() => null);
        if (warning) setTimeout(() => warning.delete().catch(() => {}), 7000);
      }
      return;
    }
  }

  const linkPattern = /https?:\/\/\S+/i;
  if (moduleEnabled(config, "antiLinks") && linkPattern.test(message.content) && message.channelId !== config.antiLinks.allowedChannelId) {
    await message.delete().catch(() => {});
    if (config.antiLinks.action !== "delete") {
      const warning = await message.channel.send({ content: `<@${message.author.id}> Links sind hier nicht erlaubt.`, allowedMentions: { users: [message.author.id] } }).catch(() => null);
      if (warning) setTimeout(() => warning.delete().catch(() => {}), 7000);
    }
    return;
  }

  if (moduleEnabled(config, "keywordFilter") && config.keywordFilter.words.some(word => word && message.content.toLocaleLowerCase().includes(word.toLocaleLowerCase()))) {
    await message.delete().catch(() => {});
    if (config.keywordFilter.action !== "delete") {
      const warning = await message.channel.send({ content: `<@${message.author.id}> Deine Nachricht enthält einen hier nicht erlaubten Begriff.`, allowedMentions: { users: [message.author.id] } }).catch(() => null);
      if (warning) setTimeout(() => warning.delete().catch(() => {}), 7000);
    }
    const log = config.keywordFilter.logChannelId ? await message.guild.channels.fetch(config.keywordFilter.logChannelId).catch(() => null) : null;
    if (log?.isTextBased()) await log.send({ content: `Wortfilter: Nachricht von ${message.author.tag} in <#${message.channelId}> wurde entfernt.`, allowedMentions: { parse: [] } }).catch(() => {});
    return;
  }

  if (moduleEnabled(config, "slowmode") && message.channelId === config.slowmode.channelId) {
    const seconds = config.slowmode.seconds;
    if (message.channel.rateLimitPerUser !== seconds) await message.channel.setRateLimitPerUser(seconds, "MoonBot Auto-Slowmode").catch(() => {});
  }

  if (moduleEnabled(config, "counting") && message.channelId === config.counting.channelId) {
    const lock = `${message.guild.id}:${message.channelId}`;
    if (countingLocks.has(lock)) return;
    countingLocks.add(lock);
    try {
      const expected = Number(config.counting.lastNumber || 0) > 0 ? Number(config.counting.lastNumber) + 1 : Number(config.counting.startNumber || 1);
      const actual = Number(message.content.trim());
      if (!Number.isInteger(actual) || actual !== expected) {
        await message.delete().catch(() => {});
      } else {
        const updated = { ...config, counting: { ...config.counting, lastNumber: actual } };
        require("./config-store").setGuildSettings(message.guild.id, updated);
        await message.react("✅").catch(() => {});
      }
    } finally {
      countingLocks.delete(lock);
    }
  }
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot || !message.content?.trim()) return;
  const settings = getGuildSettings(message.guild.id);

  if (moduleEnabled(settings, "suggestions") && settings.suggestions.channelId === message.channelId) {
    await message.react("👍").catch(() => {});
    await message.react("👎").catch(() => {});
    if (settings.suggestions.reviewChannelId) {
      const review = await message.guild.channels.fetch(settings.suggestions.reviewChannelId).catch(() => null);
      if (review?.isTextBased()) {
        const embed = new EmbedBuilder().setColor(Number.parseInt((settings.suggestions.color || "#22d3ee").slice(1), 16)).setTitle(settings.suggestions.title || "Neuer Vorschlag").setDescription(message.content.slice(0, 4000)).addFields({ name: "Von", value: `${message.author.tag}`, inline: true }, { name: "Zum Vorschlag", value: `[Nachricht öffnen](${message.url})`, inline: true }).setTimestamp();
        await review.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch(() => {});
      }
    }
  }

  if (moduleEnabled(settings, "antiInvite") && message.channelId !== settings.antiInvite.allowedChannelId && /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/[\w-]+/i.test(message.content)) {
    await message.delete().catch(() => {});
    if (settings.antiInvite.action !== "delete") {
      const warning = await message.channel.send({ content: `<@${message.author.id}> Discord-Einladungslinks sind hier nicht erlaubt.`, allowedMentions: { users: [message.author.id] } }).catch(() => null);
      if (warning) setTimeout(() => warning.delete().catch(() => {}), 7000);
    }
    return;
  }

  if (!moduleEnabled(settings, "automod")) return;
  if (!process.env.OPENAI_API_KEY) {
    if (!client.__moonbotAiKeyWarning) {
      console.warn("KI-Auto-Mod ist aktiviert, aber OPENAI_API_KEY fehlt. Bitte den API-Schlüssel als Umgebungsvariable setzen.");
      client.__moonbotAiKeyWarning = true;
    }
    return;
  }

  try {
    const result = await moderateText(message.content, settings.automod.threshold || 0.82);
    if (!result.flagged) return;
    await message.delete().catch(() => {});
    if (settings.automod.action !== "delete") {
      await message.channel.send({
        content: `<@${message.author.id}> Deine Nachricht wurde von MoonBot ausgeblendet. Bitte bleib respektvoll.`,
        allowedMentions: { users: [message.author.id] }
      }).then(warning => setTimeout(() => warning.delete().catch(() => {}), 7000)).catch(() => {});
    }
    await sendModerationLog(message.guild, settings, message, result.category);
  } catch (error) {
    console.error("AI moderation failed; message was not removed:", error);
  }
});

client.on(Events.GuildMemberRemove, async member => {
  const settings = getGuildSettings(member.guild.id);
  if (moduleEnabled(settings, "leave") && settings.leave.channelId) {
    const channel = await member.guild.channels.fetch(settings.leave.channelId).catch(() => null);
    if (channel?.isTextBased()) {
      const content = (settings.leave.message || "{username} hat den Server verlassen. Tschüss!")
        .replaceAll("{user}", member.user.username)
        .replaceAll("{username}", member.user.username)
        .replaceAll("{server}", member.guild.name);
      await channel.send({ content, allowedMentions: { parse: [] } }).catch(() => {});
    }
  }
  if (settings.logs?.memberLeave !== false) await sendServerLog(member.guild, settings, "Mitglied hat den Server verlassen", `${member.user.tag} (${member.id}) hat den Server verlassen.`);
});

client.on(Events.MessageDelete, async message => {
  if (!message.guild || message.author?.bot) return;
  const settings = getGuildSettings(message.guild.id);
  if (settings.logs?.messageDelete === false) return;
  await sendServerLog(message.guild, settings, "Nachricht gelöscht", `Autor: ${message.author?.tag || "Unbekannt"}\nKanal: <#${message.channelId}>\nInhalt: ${(message.content || "Nicht verfügbar").slice(0, 2500)}`);
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (!newMessage.guild || newMessage.author?.bot || oldMessage.content === newMessage.content) return;
  const settings = getGuildSettings(newMessage.guild.id);
  if (settings.logs?.messageEdit === false) return;
  await sendServerLog(newMessage.guild, settings, "Nachricht bearbeitet", `Autor: ${newMessage.author?.tag || "Unbekannt"}\nKanal: <#${newMessage.channelId}>\nVorher: ${(oldMessage.content || "Nicht verfügbar").slice(0, 1200)}\nNachher: ${(newMessage.content || "Nicht verfügbar").slice(0, 1200)}`);
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => null);
  const message = reaction.message;
  if (!message?.guild) return;
  const settings = getGuildSettings(message.guild.id);
  if (!moduleEnabled(settings, "starboard") || reaction.emoji.name !== (settings.starboard.emoji || "⭐")) return;
  if (reaction.count < (settings.starboard.threshold || 3)) return;
  const target = await message.guild.channels.fetch(settings.starboard.channelId).catch(() => null);
  if (!target?.isTextBased()) return;
  const recent = await target.messages.fetch({ limit: 100 }).catch(() => null);
  const marker = `MoonBot Starboard ${message.id}`;
  if (recent?.some(post => post.embeds.some(embed => embed.footer?.text === marker))) return;
  const embed = new EmbedBuilder().setColor(0xfbbf24).setAuthor({ name: message.author?.tag || "Unbekannt" }).setDescription((message.content || "Anhang oder Mediennachricht").slice(0, 3500)).addFields({ name: "Ursprung", value: `<#${message.channelId}>`, inline: true }, { name: "Nachricht", value: `[Öffnen](${message.url})`, inline: true }).setFooter({ text: marker }).setTimestamp(message.createdAt);
  const files = [...message.attachments.values()].filter(file => file.contentType?.startsWith("image/")).slice(0, 1).map(file => file.url);
  if (files[0]) embed.setImage(files[0]);
  await target.send({ content: `${settings.starboard.emoji || "⭐"} **${reaction.count}**`, embeds: [embed], allowedMentions: { parse: [] } }).catch(() => {});
});
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.guild) return;

  if (interaction.isChatInputCommand() && interaction.commandName === "moonbot") {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: "Du brauchst die Berechtigung „Server verwalten“.", ephemeral: true });
    }

    const settings = getGuildSettings(interaction.guildId);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "poll") {
      if (!moduleEnabled(settings, "polls")) return interaction.reply({ content: "Aktiviere zuerst das Umfragen-Modul.", ephemeral: true });
      const question = interaction.options.getString("frage", true);
      const target = settings.polls.channelId ? await interaction.guild.channels.fetch(settings.polls.channelId).catch(() => null) : interaction.channel;
      if (!target?.isTextBased()) return interaction.reply({ content: "Der Umfragen-Kanal wurde nicht gefunden.", ephemeral: true });
      const poll = await target.send({ embeds: [new EmbedBuilder().setColor(0x22d3ee).setTitle("📊 Umfrage").setDescription(question).setFooter({ text: `Gestartet von ${interaction.user.tag}` }).setTimestamp()] });
      await poll.react("👍").catch(() => {}); await poll.react("👎").catch(() => {});
      return interaction.reply({ content: `Umfrage erstellt: ${poll.url}`, ephemeral: true });
    }

    if (subcommand === "giveaway") {
      if (!moduleEnabled(settings, "giveaways")) return interaction.reply({ content: "Aktiviere zuerst das Giveaways-Modul.", ephemeral: true });
      const prize = interaction.options.getString("preis", true);
      const minutes = interaction.options.getInteger("minuten", true);
      const target = settings.giveaways.channelId ? await interaction.guild.channels.fetch(settings.giveaways.channelId).catch(() => null) : interaction.channel;
      if (!target?.isTextBased()) return interaction.reply({ content: "Der Giveaway-Kanal wurde nicht gefunden.", ephemeral: true });
      const giveaway = await target.send({ embeds: [new EmbedBuilder().setColor(0xfbbf24).setTitle("🎉 Giveaway").setDescription(`**Gewinn:** ${prize}\\nReagiere mit 🎉, um teilzunehmen!`).setFooter({ text: `Endet in ${minutes} Minuten` }).setTimestamp(Date.now() + minutes * 60000)] });
      await giveaway.react("🎉").catch(() => {});
      await interaction.reply({ content: `Giveaway gestartet: ${giveaway.url}`, ephemeral: true });
      setTimeout(async () => {
        const fetched = await giveaway.fetch().catch(() => null);
        const reaction = fetched?.reactions.cache.get("🎉");
        const users = reaction ? await reaction.users.fetch().catch(() => null) : null;
        const entrants = users ? [...users.values()].filter(user => !user.bot) : [];
        const winner = entrants.length ? entrants[Math.floor(Math.random() * entrants.length)] : null;
        await target.send(winner ? `🎉 Glückwunsch <@${winner.id}>! Du hast **${prize}** gewonnen.` : `Das Giveaway für **${prize}** hatte keine Teilnehmenden.`).catch(() => {});
      }, minutes * 60000);
      return;
    }

    if (subcommand === "status") {
      const embed = new EmbedBuilder()
        .setColor(0xc084fc)
        .setTitle("MoonBot – Server-Einstellungen")
        .setDescription(modules.map(name => {
          const enabled = moduleEnabled(settings, name);
          return `**${moduleLabels[name]}:** ${enabled ? "Aktiv" : "Deaktiviert"}`;
        }).join("\n"))
        .addFields({
          name: "KI-Moderation",
          value: process.env.OPENAI_API_KEY ? "KI-Verbindung konfiguriert" : "OPENAI_API_KEY fehlt – KI-Mod ist pausiert",
          inline: false
        })
        .setFooter({ text: "Einstellungen gelten nur für diesen Discord-Server." });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === "module") {
      const name = interaction.options.getString("name", true);
      const enabled = interaction.options.getBoolean("enabled", true);
      const updated = setGuildModule(interaction.guildId, name, enabled);
      return interaction.reply({
        content: `Modul **${moduleLabels[name]}** ist jetzt **${moduleEnabled(updated, name) ? "aktiviert" : "deaktiviert"}**.`,
        ephemeral: true
      });
    }

    if (subcommand === "ticket-panel") {
      if (!moduleEnabled(settings, "tickets")) {
        return interaction.reply({ content: "Aktiviere zuerst das Ticketsystem im MoonBot-Dashboard.", ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setColor(Number.parseInt((settings.tickets.color || "#22d3ee").slice(1), 16))
        .setTitle(settings.tickets.panelTitle || "Support benötigt?")
        .setDescription(settings.tickets.panelDescription || "Klicke auf die Schaltfläche, um ein privates Support-Ticket zu erstellen.");
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("moonbot:ticket:create").setLabel(settings.tickets.buttonLabel || "Ticket erstellen").setStyle(ButtonStyle.Primary).setEmoji("🎫")
      );
      const targetChannel = settings.tickets.panelChannelId
        ? await interaction.guild.channels.fetch(settings.tickets.panelChannelId).catch(() => null)
        : interaction.channel;
      if (!targetChannel?.isTextBased()) return interaction.reply({ content: "Der eingestellte Ticket-Panel-Kanal wurde nicht gefunden.", ephemeral: true });
      await targetChannel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: `Ticket-Panel wurde in ${targetChannel} veröffentlicht.`, ephemeral: true });
    }

    if (subcommand === "selfroles-panel") {
      if (!moduleEnabled(settings, "selfroles") || !settings.selfroles.roles.length) {
        return interaction.reply({ content: "Aktiviere Self Roles und trage zuerst Rollen im Dashboard ein.", ephemeral: true });
      }
      const menu = new StringSelectMenuBuilder()
        .setCustomId("moonbot:selfroles")
        .setPlaceholder(settings.selfroles.placeholder || "Wähle deine Rollen")
        .setMinValues(0)
        .setMaxValues(settings.selfroles.roles.length)
        .addOptions(settings.selfroles.roles.map(role => ({ label: role.label, value: role.id })));
      const row = new ActionRowBuilder().addComponents(menu);
      const embed = new EmbedBuilder()
        .setColor(0xc084fc)
        .setTitle(settings.selfroles.panelTitle || "Deine Rollen")
        .setDescription(settings.selfroles.panelDescription || "Wähle die Rollen aus, die du haben möchtest. Entferne die Auswahl, um eine Rolle wieder abzugeben.");
      const targetChannel = settings.selfroles.channelId
        ? await interaction.guild.channels.fetch(settings.selfroles.channelId).catch(() => null)
        : interaction.channel;
      if (!targetChannel?.isTextBased()) return interaction.reply({ content: "Der eingestellte Self-Roles-Kanal wurde nicht gefunden.", ephemeral: true });
      await targetChannel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: `Self-Roles-Panel wurde in ${targetChannel} veröffentlicht.`, ephemeral: true });
    }
  }

  if (interaction.isButton() && interaction.customId === "moonbot:ticket:create") {
    await interaction.deferReply({ ephemeral: true });
    const settings = getGuildSettings(interaction.guildId);
    if (!moduleEnabled(settings, "tickets")) return interaction.editReply("Das Ticketsystem ist deaktiviert.");
    const existing = interaction.guild.channels.cache.find(channel =>
      channel.type === ChannelType.GuildText && channel.topic === `moonbot-ticket:${interaction.user.id}`
    );
    if (existing) return interaction.editReply(`Du hast bereits ein offenes Ticket: <#${existing.id}>`);

    const overwrites = [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ReadMessageHistory] }
    ];
    if (settings.tickets.supportRoleId) {
      overwrites.push({
        id: settings.tickets.supportRoleId,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
      });
    }
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 18) || "support"}`,
      type: ChannelType.GuildText,
      parent: settings.tickets.categoryId || undefined,
      topic: `moonbot-ticket:${interaction.user.id}`,
      permissionOverwrites: overwrites,
      reason: "MoonBot support ticket"
    }).catch(error => {
      console.error("Ticket creation failed:", error);
      return null;
    });
    if (!channel) return interaction.editReply("Das Ticket konnte nicht erstellt werden. Prüfe die Bot-Berechtigung „Kanäle verwalten“.");
    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("moonbot:ticket:close").setLabel("Ticket schließen").setStyle(ButtonStyle.Danger)
    );
    await channel.send({
      content: `Hallo <@${interaction.user.id}>! Beschreibe hier dein Anliegen. Das Support-Team hilft dir weiter.`,
      components: [closeRow],
      allowedMentions: { users: [interaction.user.id] }
    });
    return interaction.editReply(`Dein Ticket wurde erstellt: <#${channel.id}>`);
  }

  if (interaction.isButton() && interaction.customId === "moonbot:ticket:close") {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) return interaction.reply({ content: "Dieser Kanal kann nicht geschlossen werden.", ephemeral: true });
    const isOwner = channel.topic === `moonbot-ticket:${interaction.user.id}`;
    const canManage = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);
    if (!isOwner && !canManage) return interaction.reply({ content: "Nur die Person, die das Ticket erstellt hat, oder das Support-Team kann es schließen.", ephemeral: true });
    await interaction.deferReply();
    const ticketOwnerId = channel.topic?.startsWith("moonbot-ticket:") ? channel.topic.slice("moonbot-ticket:".length) : null;
    if (ticketOwnerId) await channel.permissionOverwrites.edit(ticketOwnerId, { SendMessages: false }).catch(() => {});
    await channel.setName(`closed-${channel.name}`.slice(0, 95)).catch(() => {});
    return interaction.editReply("Ticket wurde geschlossen. Der Kanal ist jetzt gesperrt.");
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "moonbot:selfroles") {
    const settings = getGuildSettings(interaction.guildId);
    if (!moduleEnabled(settings, "selfroles")) return interaction.reply({ content: "Self Roles sind deaktiviert.", ephemeral: true });
    const allowed = new Set(settings.selfroles.roles.map(role => role.id));
    const selected = new Set(interaction.values.filter(id => allowed.has(id)));
    await interaction.deferReply({ ephemeral: true });
    const results = [];
    for (const roleId of allowed) {
      const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
      if (!role || !role.editable) continue;
      if (selected.has(roleId)) {
        await interaction.member.roles.add(role).catch(() => {});
        results.push(role.name);
      } else if (interaction.member.roles.cache.has(roleId)) {
        await interaction.member.roles.remove(role).catch(() => {});
      }
    }
    return interaction.editReply(results.length ? `Deine Auswahl wurde aktualisiert: ${results.join(", ")}` : "Deine Self-Roles-Auswahl wurde aktualisiert.");
  }
});

client.login(token).catch(error => {
  console.error("Discord login failed:", error);
  process.exit(1);
});
