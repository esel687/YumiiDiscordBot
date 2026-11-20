import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const saved = request.cookies.get("yumiibot_oauth_state")?.value;
  if (!code || !state || !saved || state !== saved) return NextResponse.redirect(new URL("/?error=oauth", request.url));
  const clientId = process.env.DISCORD_CLIENT_ID, clientSecret = process.env.DISCORD_CLIENT_SECRET, redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return NextResponse.redirect(new URL("/?error=config", request.url));
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    cache: "no-store"
  });
  if (!tokenRes.ok) return NextResponse.redirect(new URL("/?error=token", request.url));
  const token = await tokenRes.json() as { access_token: string; token_type: string };
  const userRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: token.token_type + " " + token.access_token }, cache: "no-store" });
  if (!userRes.ok) return NextResponse.redirect(new URL("/?error=user", request.url));
  const user = await userRes.json() as { id: string; username: string; avatar: string | null };
  await createSession(user);
  const response = NextResponse.redirect(new URL("/?login=success", request.url));
  response.cookies.delete("yumiibot_oauth_state");
  return response;
}