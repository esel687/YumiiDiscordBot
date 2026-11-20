import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  const user = await readSession();

  return NextResponse.json({
    sessionCookiePresent: Boolean(token),
    sessionSecretConfigured: Boolean(secret),
    sessionSecretLengthValid: Boolean(secret && secret.length >= 32),
    sessionValid: Boolean(user),
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
