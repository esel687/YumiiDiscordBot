import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await readSession();
  const guildId = request.nextUrl.searchParams.get("guildId");
  const guilds = Array.isArray(session?.guilds) ? session.guilds : [];
  if (!session || !guildId || !/^\d{17,20}$/.test(guildId) || !guilds.some(guild => guild.id === guildId && guild.owner === true)) {
    return NextResponse.json({ error: "Nur der Serverbesitzer darf MoonBot einstellen." }, { status: 403 });
  }

  const base = process.env.MOONBOT_API_URL?.replace(/\/$/, "");
  const secret = process.env.MOONBOT_API_SECRET;
  if (!base || !secret) return NextResponse.json({ error: "Bot-Verbindung ist noch nicht konfiguriert." }, { status: 503 });
  try {
    const parsed = new URL(base);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("Invalid API URL");
    const response = await fetch(`${base}/guilds/${guildId}/resources`, {
      headers: { "x-moonbot-secret": secret },
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Discord-Kanäle und Rollen konnten nicht geladen werden. Prüfe, ob MoonBot online ist." }, { status: 503 });
  }
}
