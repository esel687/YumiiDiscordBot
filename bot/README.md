# YumiiBot runtime

## Bot-Hosting.net

- Repository: `esel687/YumiiDiscordBot`
- Node.js: 22.x (oder eine kompatible aktuelle Node-Version)
- Install command: `npm install`
- Start command: `npm run bot`

## Environment variables

- `DISCORD_TOKEN`: Bot token from the Discord Developer Portal
- `DISCORD_CLIENT_ID`: Application ID from the General Information page

Never commit real tokens to GitHub or send them in chat.

## Included commands

- `/yb status`: shows this guild's module settings
- `/yb module name:<module> enabled:<true|false>`: changes one module for this guild

Settings are stored per guild in `bot/data/guild-settings.json`. Make sure the hosting provider keeps the bot's working directory persistent across restarts/deployments.

The dashboard is a separate Next.js app. A shared database and authenticated dashboard-to-bot settings API are still required before dashboard changes can control the live bot.
