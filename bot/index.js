require("dotenv").config();
const {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");
const { getGuildSettings, setGuildModule } = require("./config-store");

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

const modules = ["welcome", "tickets", "automod", "logs"];
const commands = [
  new SlashCommandBuilder()
    .setName("yb")
    .setDescription("YumiiBot server tools")
    .addSubcommand(sub => sub.setName("status").setDescription("Show this server's YumiiBot settings"))
    .addSubcommand(sub => sub
      .setName("module")
      .setDescription("Enable or disable a module for this server")
      .addStringOption(option => option.setName("name").setDescription("Module to change").setRequired(true)
        .addChoices(...modules.map(name => ({ name, value: name }))))
      .addBooleanOption(option => option.setName("enabled").setDescription("Whether the module should be enabled").setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON()
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("YumiiBot slash commands registered.");
  } catch (error) {
    console.error("Could not register slash commands:", error);
  }
});

client.on(Events.GuildCreate, guild => {
  getGuildSettings(guild.id);
  console.log(`Joined server: ${guild.name} (${guild.id})`);
});

client.on(Events.GuildDelete, guild => {
  console.log(`Removed from server: ${guild.name} (${guild.id})`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "yb" || !interaction.guildId) return;

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: "Du brauchst die Berechtigung „Server verwalten“.", ephemeral: true });
  }

  if (interaction.options.getSubcommand() === "status") {
    const settings = getGuildSettings(interaction.guildId);
    const embed = new EmbedBuilder()
      .setColor(0x36d6d0)
      .setTitle("YumiiBot – Server-Einstellungen")
      .setDescription(modules.map(name => `**${name}:** ${settings[name] ? "Aktiv" : "Deaktiviert"}`).join("\n"))
      .setFooter({ text: "Diese Einstellungen gelten nur für diesen Discord-Server." });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (interaction.options.getSubcommand() === "module") {
    const name = interaction.options.getString("name", true);
    const enabled = interaction.options.getBoolean("enabled", true);
    const settings = setGuildModule(interaction.guildId, name, enabled);
    return interaction.reply({
      content: `Modul **${name}** ist jetzt **${settings[name] ? "aktiviert" : "deaktiviert"}**. Diese Änderung gilt nur für diesen Server.`,
      ephemeral: true
    });
  }
});

client.login(token).catch(error => {
  console.error("Discord login failed:", error);
  process.exit(1);
});
