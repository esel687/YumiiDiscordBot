import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
 try {
  const body=await request.json();
  const target=typeof body.target==="string"?body.target:"";
  const texts=Array.isArray(body.texts)?body.texts:[];
  if(!/^[a-zA-Z-]{2,12}$/.test(target)||texts.length>80||texts.some((t:unknown)=>typeof t!=="string"||t.length>5000))return NextResponse.json({error:"Ungültige Anfrage."},{status:400});
  if(!texts.length)return NextResponse.json({translations:[]});
  const key=process.env.GOOGLE_TRANSLATE_API_KEY;
  if(!key)return NextResponse.json({error:"Übersetzungsdienst nicht konfiguriert."},{status:503});
  const response=await fetch("https://translation.googleapis.com/language/translate/v2?key="+encodeURIComponent(key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q:texts,target,format:"text"}),cache:"no-store"});
  if(!response.ok)return NextResponse.json({error:"Übersetzungsdienst hat die Anfrage abgelehnt."},{status:502});
  const data=await response.json();
  const translations=data?.data?.translations?.map((item:{translatedText?:string})=>item.translatedText??"");
  if(!Array.isArray(translations)||translations.length!==texts.length)return NextResponse.json({error:"Ungültige Antwort vom Übersetzungsdienst."},{status:502});
  return NextResponse.json({translations});
 } catch { return NextResponse.json({error:"Übersetzung derzeit nicht verfügbar."},{status:500}); }
}
