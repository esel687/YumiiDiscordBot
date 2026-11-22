import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getDeepLEndpoint(key: string) {
  return key.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
}

export async function GET() {
  const key = process.env.DEEPL_AUTH_KEY;
  if (!key) return NextResponse.json({ error: "DeepL ist noch nicht eingerichtet." }, { status: 503 });

  try {
    const response = await fetch(
      `${getDeepLEndpoint(key)}/v3/languages?resource=translate_text`,
      { headers: { Authorization: `DeepL-Auth-Key ${key}` }, cache: "no-store" }
    );
    if (!response.ok) return NextResponse.json({ error: "Sprachen konnten nicht geladen werden." }, { status: 502 });
    const languages = await response.json();
    return NextResponse.json({
      languages: languages
        .filter((item: { usable_as_target?: boolean }) => item.usable_as_target)
        .map((item: { lang: string; name: string }) => ({ code: item.lang, name: item.name }))
    });
  } catch {
    return NextResponse.json({ error: "DeepL ist derzeit nicht erreichbar." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const target = typeof body.target === "string" ? body.target : "";
    const texts = Array.isArray(body.texts) ? body.texts : [];

    if (!/^[a-zA-Z-]{2,12}$/.test(target) || texts.length > 80 ||
      texts.some((item: unknown) => typeof item !== "string" || item.length > 5000)) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    if (!texts.length) return NextResponse.json({ translations: [] });

    const key = process.env.DEEPL_AUTH_KEY;
    if (!key) return NextResponse.json({ error: "DeepL API-Schlüssel fehlt noch." }, { status: 503 });

    const endpoint = `${getDeepLEndpoint(key)}/v2/translate`;
    const translations: string[] = [];

    // DeepL accepts up to 50 text entries per translation request.
    for (let index = 0; index < texts.length; index += 50) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: texts.slice(index, index + 50), target_lang: target }),
        cache: "no-store"
      });

      if (!response.ok) {
        const status = response.status;
        const message = status === 456 ? "DeepL-Kontingent aufgebraucht" :
          status === 403 ? "DeepL API-Schlüssel wurde abgelehnt" :
          "DeepL konnte die Übersetzung nicht ausführen";
        return NextResponse.json({ error: message }, { status: 502 });
      }

      const data = await response.json();
      const batch = data?.translations?.map((item: { text?: string }) => item.text ?? "");
      if (!Array.isArray(batch) || batch.length !== Math.min(50, texts.length - index)) {
        return NextResponse.json({ error: "Ungültige Antwort von DeepL." }, { status: 502 });
      }
      translations.push(...batch);
    }

    return NextResponse.json({ translations });
  } catch {
    return NextResponse.json({ error: "Übersetzung derzeit nicht verfügbar." }, { status: 500 });
  }
}
