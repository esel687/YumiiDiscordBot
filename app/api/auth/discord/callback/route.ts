import { NextRequest, NextResponse } from "next/server";
import { createSession, SESSION_COOKIE } from "@/lib/session";

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
  owner: boolean;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("moonbot_oauth_state")?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/?error=oauth", request.url));
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/?error=config", request.url));
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL("/?error=token", request.url));
    }

    const token = await tokenResponse.json() as { access_token: string; token_type: string };
    const headers = { Authorization: `${token.token_type} ${token.access_token}` };

    const [userResponse, guildResponse] = await Promise.all([
      fetch("https://discord.com/api/users/@me", { headers, cache: "no-store" }),
      fetch("https://discord.com/api/users/@me/guilds", { headers, cache: "no-store" }),
    ]);

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL("/?error=user", request.url));
    }

    const user = await userResponse.json() as {
      id: string;
      username: string;
      avatar: string | null;
    };
    const allGuilds = guildResponse.ok
      ? await guildResponse.json() as DiscordGuild[]
      : [];

    const guilds = allGuilds
      .filter(g => {
        const permissions = BigInt(g.permissions);
        return g.owner || (permissions & 0x20n) === 0x20n || (permissions & 0x8n) === 0x8n;
      })
      .map(({ id, name, icon, permissions, owner }) => ({
        id, name, icon, permissions, owner,
      }));

    const sessionToken = await createSession({ ...user, guilds });
    const response = NextResponse.redirect(new URL("/", request.url));

    // Set the cookie on the exact response returned to the browser.
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.delete("moonbot_oauth_state");

    return response;
  } catch {
    return NextResponse.redirect(new URL("/?error=session", request.url));
  }
}
