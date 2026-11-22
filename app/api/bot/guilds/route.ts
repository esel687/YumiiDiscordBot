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

  try {
    const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bot ${token}` },
      cache: "no-store"
    });

    if (!response.ok) {
      console.error("MoonBot guild lookup failed:", response.status);
      return NextResponse.json({ error: "Discord-Serverliste konnte nicht geladen werden." }, { status: 502 });
    }

    const guilds = await response.json() as Array<{ id: string }>;
    return NextResponse.json({ guildIds: guilds.map(guild => guild.id) }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" }
    });
  } catch (error) {
    console.error("MoonBot guild lookup error:", error);
    return NextResponse.json({ error: "Discord-Verbindung fehlgeschlagen." }, { status: 502 });
  }
}
