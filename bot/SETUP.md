# MoonBot Bot Setup

## Runtime
Start the bot with:

```bash
npm install
npm run bot
```

The bot also starts its private control API in the same process.

## Environment variables on Bot-Hosting
- `DISCORD_TOKEN`: Discord bot token
- `DISCORD_CLIENT_ID`: Discord application ID
- `MOONBOT_API_SECRET`: a long random secret shared with the Vercel dashboard
- `MOONBOT_API_PORT`: the port allocated by the host (or use the host-provided `PORT`)
- `OPENAI_API_KEY`: optional; required for AI-based moderation

Do not put real secrets in GitHub. Set them in the hosting provider's environment-variable panel.

## Vercel environment variables
- `MOONBOT_API_URL`: public HTTPS base URL for the bot control API, without a trailing slash
- `MOONBOT_API_SECRET`: exactly the same random secret as on the bot host

The control API must be reachable over HTTPS. Do not use a plain HTTP URL because the shared secret would not be protected in transit.

## Discord Developer Portal
Enable these privileged Gateway Intents for the bot:
- Server Members Intent
- Message Content Intent

The bot needs these server permissions:
- View Channels
- Send Messages
- Read Message History
- Manage Channels (tickets)
- Manage Roles (Auto Role and Self Roles)
- Manage Messages (AI Auto-Mod)

Keep the bot's highest role above every role it should assign.

## Slash commands
- `/moonbot status`: show module status
- `/moonbot module`: enable or disable a module
- `/moonbot ticket-panel`: publish the ticket panel
- `/moonbot selfroles-panel`: publish the self-role selector

## AI moderation and privacy
When enabled and configured, message text is sent to OpenAI's Moderation API for classification. MoonBot only acts on harassment, hate, or threatening-harassment categories. If the API is unavailable, MoonBot does not delete the message. Make sure server members are informed and that the server owner has approved this data flow.

The moderation API key must be managed by an adult account holder; do not share it in chat or commit it to the repository.
