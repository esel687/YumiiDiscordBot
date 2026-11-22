"use client";
import { useEffect, useState } from "react";

const FALLBACK_LANGUAGES: [string, string][] = [
  ["de","Deutsch"],["en","English"],["en-US","English (American)"],["en-GB","English (British)"],
  ["fr","Français"],["es","Español"],["it","Italiano"],["nl","Nederlands"],["pl","Polski"],
  ["pt-BR","Português (Brasil)"],["pt-PT","Português (Portugal)"],["ru","Русский"],
  ["ja","日本語"],["zh","中文"],["ko","한국어"],["ar","العربية"],["bg","Български"],
  ["cs","Čeština"],["da","Dansk"],["el","Ελληνικά"],["et","Eesti"],["fi","Suomi"],
  ["hu","Magyar"],["id","Bahasa Indonesia"],["lt","Lietuvių"],["lv","Latviešu"],
  ["nb","Norsk Bokmål"],["ro","Română"],["sk","Slovenčina"],["sl","Slovenščina"],
  ["sv","Svenska"],["tr","Türkçe"],["uk","Українська"],["vi","Tiếng Việt"]
];
const LANGUAGE_FLAGS: Record<string,string> = {
 de:"🇩🇪", en:"🇬🇧", "en-US":"🇺🇸", "en-GB":"🇬🇧", fr:"🇫🇷", es:"🇪🇸", it:"🇮🇹",
 nl:"🇳🇱", pl:"🇵🇱", "pt-BR":"🇧🇷", "pt-PT":"🇵🇹", ru:"🇷🇺", ja:"🇯🇵",
 zh:"🇨🇳", "zh-CN":"🇨🇳", "zh-TW":"🇹🇼", ko:"🇰🇷", ar:"🇸🇦", bg:"🇧🇬",
 cs:"🇨🇿", da:"🇩🇰", el:"🇬🇷", et:"🇪🇪", fi:"🇫🇮", hu:"🇭🇺", id:"🇮🇩",
 lt:"🇱🇹", lv:"🇱🇻", nb:"🇳🇴", ro:"🇷🇴", sk:"🇸🇰", sl:"🇸🇮", sv:"🇸🇪",
 tr:"🇹🇷", uk:"🇺🇦", vi:"🇻🇳"
};
const getLanguageFlag = (code: string) => LANGUAGE_FLAGS[code] || LANGUAGE_FLAGS[code.split("-")[0]] || "🌐";
const originalText = new WeakMap<Text,string>();
const trackedNodes = new Set<Text>();
const translationCache = new Map<string,string>();
const ignoredTags = new Set(["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","INPUT","SELECT","OPTION","CODE","PRE","SVG"]);

export default function LanguageTools() {
 const [language,setLanguage]=useState("de");
 const [languages,setLanguages]=useState<[string,string][]>(FALLBACK_LANGUAGES);
 const [ready,setReady]=useState(false);
 const [open,setOpen]=useState(false);
 const [query,setQuery]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{
  fetch("/api/translate").then(r=>r.ok?r.json():null).then(data=>{if(Array.isArray(data?.languages)&&data.languages.length){setLanguages(data.languages.map((item:{code:string;name:string})=>[item.code,item.name] as [string,string]));}}).catch(()=>{});
  const saved=localStorage.getItem("moonbot-language");
  const browser=(navigator.language||"en").toLowerCase();
  const detected=browser.startsWith("zh")?(browser.includes("tw")||browser.includes("hk")?"zh-TW":"zh-CN"):browser.split("-")[0];
  setLanguage(saved || (FALLBACK_LANGUAGES.some(([code])=>code===detected)?detected:"en"));
  setReady(true);
 },[]);
 useEffect(()=>{
  if(!ready)return;
  localStorage.setItem("moonbot-language",language);
  document.documentElement.lang=language;
  trackedNodes.forEach(node=>{if(node.isConnected){const original=originalText.get(node);if(original!==undefined)node.nodeValue=original;}else trackedNodes.delete(node);});
  if(language==="de"){setError("");return;}
  let stopped=false,working=false;
  const pending=new Set<Text>();
  const isExcluded=(node:Text)=>{
   let el=node.parentElement;
   while(el&&el!==document.body){if(ignoredTags.has(el.tagName)||el.hasAttribute("data-no-translate"))return true;el=el.parentElement;}
   return false;
  };
  const translate=async()=>{
   if(working||stopped||!pending.size)return;
   working=true;
   const batch=Array.from(pending).slice(0,80);batch.forEach(n=>pending.delete(n));
   const texts=batch.map(n=>originalText.get(n)??n.nodeValue??"");
   const unique=Array.from(new Set(texts.filter(t=>t.trim()&&/[\p{L}]{2}/u.test(t))));
   const missing=unique.filter(t=>!translationCache.has(language+"|"+t));
   try{
    for(let i=0;i<missing.length;i+=80){
     const response=await fetch("/api/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({target:language,texts:missing.slice(i,i+80)})});
     if(!response.ok)throw new Error(response.status===503?"DeepL API-Schlüssel fehlt noch":"Übersetzung fehlgeschlagen");
     const data=await response.json();
     data.translations.forEach((value:string,index:number)=>translationCache.set(language+"|"+missing[i+index],value));
    }
    if(!stopped)batch.forEach((node,index)=>{const value=translationCache.get(language+"|"+texts[index]);if(value&&node.isConnected&&node.nodeValue!==value)node.nodeValue=value;});
    setError("");
   }catch(e){if(!stopped)setError(e instanceof Error?e.message:"Übersetzung fehlgeschlagen");}
   finally{working=false;if(pending.size&&!stopped)void translate();}
  };
  const collect=(root:Node)=>{
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
   let current:Node|null;
   while((current=walker.nextNode())){
    const node=current as Text;
    if(isExcluded(node)||!node.nodeValue?.trim()||!/[\p{L}]{2}/u.test(node.nodeValue))continue;
    if(!originalText.has(node)){originalText.set(node,node.nodeValue);trackedNodes.add(node);}
    pending.add(node);
   }
   void translate();
  };
  collect(document.body);
  const observer=new MutationObserver(records=>{
   records.forEach(record=>{
    record.addedNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE){const t=node as Text;if(!isExcluded(t)&&t.nodeValue?.trim()){if(!originalText.has(t)){originalText.set(t,t.nodeValue??"");trackedNodes.add(t);}pending.add(t);}}else if(node.nodeType===Node.ELEMENT_NODE)collect(node);});
    if(record.type==="characterData"&&record.target instanceof Text){const t=record.target;if(!isExcluded(t)&&t.nodeValue?.trim()&&originalText.has(t)){pending.add(t);}}
   });
   void translate();
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  return()=>{stopped=true;observer.disconnect();};
 },[language,ready]);
 if(!ready)return null;
 const currentName=languages.find(([code])=>code===language)?.[1]??language;
 return <div className="moonLanguage" data-no-translate>
  <button className="moonLanguageButton" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>🌐 <span>{getLanguageFlag(language)} {currentName}</span> <span>⌄</span></button>
  {open&&<div className="moonLanguageMenu"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Sprache suchen …" aria-label="Sprache suchen"/><div className="moonLanguageList">{languages.filter(([,name])=>name.toLowerCase().includes(query.toLowerCase())).map(([code,name])=><button key={code} className="moonLanguageOption" onClick={()=>{setLanguage(code);setOpen(false);setQuery("");}}>{getLanguageFlag(code)} {name}{language===code?" ✓":""}</button>)}</div></div>}
  {error&&<span className="moonLanguageStatus">{error}. DEEPL_AUTH_KEY in Vercel erforderlich.</span>}
 </div>;
}
