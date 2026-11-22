import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "DISCORD_TOKEN fehlt." }, { status: 503 });
  }

  // Discord's bot token cannot list guilds through /users/@me/guilds.
  // Check whether the bot user is a member of each server the signed-in
  // user can manage. Keep concurrency low to avoid Discord rate limits.
  const manageableGuilds = session.guilds ?? [];
  const installedIds: string[] = [];
  const batchSize = 5;

  try {
    for (let index = 0; index < manageableGuilds.length; index += batchSize) {
      const batch = manageableGuilds.slice(index, index + batchSize);
      const results = await Promise.all(batch.map(async guild => {
        const response = await fetch(
          `https://discord.com/api/v10/guilds/${guild.id}`,
          {
            headers: { Authorization: `Bot ${token}` },
            cache: "no-store"
          }
        );
        if (response.status === 200) return guild.id;
        if (response.status === 404) return null;
        throw new Error(`Discord guild membership check failed: ${response.status}`);
      }));
      installedIds.push(...results.filter((id): id is string => Boolean(id)));
    }

    return NextResponse.json({ guildIds: installedIds }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" }
    });
  } catch (error) {
    console.error("MoonBot guild lookup error:", error);
    return NextResponse.json({ error: "Discord-Verbindung fehlgeschlagen." }, { status: 502 });
  }
}
