import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const COOKIE = "moonbot_session";
type Guild={id:string;name:string;icon:string|null;permissions:string;owner:boolean};
type SessionUser={id:string;username:string;avatar:string|null;guilds:Guild[]};
function key(){const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32)throw new Error("SESSION_SECRET fehlt oder ist zu kurz.");return new TextEncoder().encode(secret)}
export async function createSession(user:SessionUser){const token=await new SignJWT(user).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(key());const jar=await cookies();jar.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:604800})}
export async function readSession(){const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;try{return(await jwtVerify(token,key())).payload as SessionUser}catch{return null}}
export async function clearSession(){(await cookies()).delete(COOKIE)}
export function randomState(){const bytes=crypto.getRandomValues(new Uint8Array(24));return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}
