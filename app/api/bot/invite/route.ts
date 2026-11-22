import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // MoonBot's Discord Application ID.
  const clientId = "1573092807059439726";
  const permissions = "268528656";
  const guildId = request.nextUrl.searchParams.get("guild_id");
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "bot applications.commands",
    permissions,
    disable_guild_select: guildId ? "true" : "false"
  });

  // Only accept a Discord snowflake as the target server ID.
  if (guildId && /^\d{17,20}$/.test(guildId)) {
    params.set("guild_id", guildId);
  }

  return NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );
}
