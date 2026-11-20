import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
type DiscordGuild={id:string;name:string;icon:string|null;permissions:string;owner:boolean};
export async function GET(request:NextRequest){
const code=request.nextUrl.searchParams.get("code"),state=request.nextUrl.searchParams.get("state"),saved=request.cookies.get("moonbot_oauth_state")?.value;
if(!code||!state||!saved||state!==saved)return NextResponse.redirect(new URL("/?error=oauth",request.url));
const clientId=process.env.DISCORD_CLIENT_ID,clientSecret=process.env.DISCORD_CLIENT_SECRET,redirectUri=process.env.DISCORD_REDIRECT_URI;
if(!clientId||!clientSecret||!redirectUri)return NextResponse.redirect(new URL("/?error=config",request.url));
const tokenRes=await fetch("https://discord.com/api/oauth2/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:"authorization_code",code,redirect_uri:redirectUri}),cache:"no-store"});
if(!tokenRes.ok)return NextResponse.redirect(new URL("/?error=token",request.url));
const token=await tokenRes.json() as {access_token:string;token_type:string},headers={Authorization:token.token_type+" "+token.access_token};
const[userRes,guildRes]=await Promise.all([fetch("https://discord.com/api/users/@me",{headers,cache:"no-store"}),fetch("https://discord.com/api/users/@me/guilds",{headers,cache:"no-store"})]);
if(!userRes.ok)return NextResponse.redirect(new URL("/?error=user",request.url));
const user=await userRes.json() as {id:string;username:string;avatar:string|null},allGuilds=guildRes.ok?await guildRes.json() as DiscordGuild[]:[];
const guilds=allGuilds.filter(g=>g.owner||(BigInt(g.permissions)&0x20n)===0x20n||(BigInt(g.permissions)&0x8n)===0x8n).map(({id,name,icon,permissions,owner})=>({id,name,icon,permissions,owner}));
await createSession({...user,guilds});
const response=NextResponse.redirect(new URL("/",request.url));response.cookies.delete("moonbot_oauth_state");return response;
}
