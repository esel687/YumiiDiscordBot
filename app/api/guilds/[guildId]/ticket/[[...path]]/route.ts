import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ guildId: string; path?: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
  const session = await readSession();
  const { guildId, path = [] } = await context.params;

  if (!session || !/^\d{17,20}$/.test(guildId)) {
    return NextResponse.json({ ok: false, error: "Bitte melde dich zuerst an." }, { status: 401 });
  }

  const guild = (Array.isArray(session.guilds) ? session.guilds : []).find(item => item.id === guildId);
  let canManage = guild?.owner === true;
  try {
    canManage = canManage || (BigInt(guild?.permissions || "0") & 0x20n) === 0x20n;
  } catch {
    canManage = false;
  }
  if (!guild || !canManage) {
    return NextResponse.json({ ok: false, error: "Du benötigst die Berechtigung „Server verwalten“." }, { status: 403 });
  }

  const base = process.env.MOONBOT_API_URL?.replace(/\/$/, "");
  const secret = process.env.MOONBOT_API_SECRET;
  if (!base || !secret) {
    return NextResponse.json({ ok: false, error: "Die Verbindung zum Bot ist nicht konfiguriert." }, { status: 503 });
  }

  try {
    const suffix = path.length ? "/" + path.map(part => encodeURIComponent(part)).join("/") : "";
    const headers: Record<string, string> = { "x-moonbot-secret": secret };
    let body: string | undefined;
    if (!["GET", "HEAD"].includes(request.method)) {
      headers["content-type"] = "application/json";
      body = await request.text();
    }
    const response = await fetch(base + "/guilds/" + guildId + "/ticket" + suffix, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json().catch(() => ({ ok: false, error: "Der Bot hat eine ungültige Antwort gesendet." }));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ ok: false, error: "Der MoonBot-Botserver ist nicht erreichbar." }, { status: 503 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
export async function POST(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
export async function PATCH(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
export async function PUT(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
