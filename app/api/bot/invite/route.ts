import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "DISCORD_CLIENT_ID ist in den Vercel-Umgebungsvariablen nicht gesetzt." },
      { status: 500 }
    );
  }

  // Permissions required by the currently implemented MoonBot modules:
  // View Channels, Manage Channels, Send Messages, Manage Messages,
  // Embed Links, Read Message History and Manage Roles.
  const permissions = "268528656";
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "bot applications.commands",
    permissions,
    disable_guild_select: "false"
  });

  return NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );
}
