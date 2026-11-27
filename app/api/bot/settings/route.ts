import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorizedGuild(request: NextRequest) {
  const session = await readSession();
  const guildId = request.nextUrl.searchParams.get("guildId");
  if (!session || !guildId || !/^\d{17,20}$/.test(guildId)) return null;
  const guilds = Array.isArray(session.guilds) ? session.guilds : [];
  const guild = guilds.find(guild => guild.id === guildId);
  return guild?.owner === true ? { guildId, owner: true } : null;
}

function config() {
  const base = process.env.MOONBOT_API_URL?.replace(/\/$/, "");
  const secret = process.env.MOONBOT_API_SECRET;
  if (!base || !secret) return null;
  try {
    const parsed = new URL(base);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
  } catch {
    return null;
  }
  return { base, secret };
}

export async function GET(request: NextRequest) {
  const access = await authorizedGuild(request);
  if (!access) return NextResponse.json({ error: "Nur der Serverbesitzer darf MoonBot einstellen." }, { status: 403 });
  const { guildId } = access;
  const api = config();
  if (!api) return NextResponse.json({ error: "Bot-Verbindung ist noch nicht konfiguriert." }, { status: 503 });
  try {
    const response = await fetch(`${api.base}/guilds/${guildId}/settings`, {
      headers: { "x-moonbot-secret": api.secret },
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "MoonBot-Botserver ist nicht erreichbar." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const access = await authorizedGuild(request);
  if (!access) return NextResponse.json({ error: "Nicht angemeldet oder keine Serverberechtigung." }, { status: 403 });
  const { guildId } = access;
  const api = config();
  if (!api) return NextResponse.json({ error: "Bot-Verbindung ist noch nicht konfiguriert." }, { status: 503 });
  try {
    const body = await request.json();
    if (body.settings?.antiLinks && Object.prototype.hasOwnProperty.call(body.settings.antiLinks, "allowedDomains")) {
      const currentResponse = await fetch(`${api.base}/guilds/${guildId}/settings`, {
        headers: { "x-moonbot-secret": api.secret }, cache: "no-store", signal: AbortSignal.timeout(8000)
      });
      const currentData = await currentResponse.json();
      const before = JSON.stringify([...(currentData.settings?.antiLinks?.allowedDomains || [])].sort());
      const after = JSON.stringify([...(body.settings.antiLinks.allowedDomains || [])].sort());

    }
    const response = await fetch(`${api.base}/guilds/${guildId}/settings`, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-moonbot-secret": api.secret },
      body: JSON.stringify({ settings: body.settings }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "MoonBot-Botserver ist nicht erreichbar." }, { status: 503 });
  }
}
