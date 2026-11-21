import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "@/lib/session";

export async function GET(request: NextRequest) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  const user = await readSession();
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  let redirectUriHostMatchesRequestHost = false;
  try {
    const redirectHost = new URL(redirectUri ?? "").host;
    const requestHost = request.headers.get("host") ?? request.nextUrl.host;
    redirectUriHostMatchesRequestHost = Boolean(redirectHost && requestHost && redirectHost === requestHost);
  } catch {
    redirectUriHostMatchesRequestHost = false;
  }

  return NextResponse.json({
    sessionCookiePresent: Boolean(token),
    sessionSecretConfigured: Boolean(secret),
    sessionSecretLengthValid: Boolean(secret && secret.length >= 32),
    sessionValid: Boolean(user),
    discordClientIdConfigured: Boolean(clientId),
    discordClientSecretConfigured: Boolean(clientSecret),
    redirectUriConfigured: Boolean(redirectUri),
    redirectUriHostMatchesRequestHost,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
