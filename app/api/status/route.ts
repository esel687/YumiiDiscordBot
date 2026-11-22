export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.MOONBOT_API_URL?.replace(/\\/$/, "");
  if (!baseUrl) {
    return Response.json({ status: "unknown", message: "Statusverbindung ist noch nicht eingerichtet." }, { status: 200 });
  }
  try {
    const response = await fetch(`${baseUrl}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error("Bot health check failed");
    const data = await response.json();
    return Response.json({ status: data.ok ? "online" : "offline", checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "offline", checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  }
}
