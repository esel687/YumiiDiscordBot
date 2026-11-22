"use client";
import { useEffect, useState } from "react";

const LANGUAGES = [
["af","Afrikaans"],["sq","Albanian"],["am","Amharic"],["ar","Arabic"],["hy","Armenian"],["as","Assamese"],["ay","Aymara"],["az","Azerbaijani"],["bm","Bambara"],["eu","Basque"],["be","Belarusian"],["bn","Bengali"],["bho","Bhojpuri"],["bs","Bosnian"],["bg","Bulgarian"],["my","Burmese"],["ca","Catalan"],["ceb","Cebuano"],["zh-CN","Chinese (Simplified)"],["zh-TW","Chinese (Traditional)"],["co","Corsican"],["hr","Croatian"],["cs","Czech"],["da","Danish"],["dv","Dhivehi"],["doi","Dogri"],["nl","Dutch"],["en","English"],["eo","Esperanto"],["et","Estonian"],["ee","Ewe"],["tl","Filipino"],["fi","Finnish"],["fr","French"],["fy","Frisian"],["gl","Galician"],["ka","Georgian"],["de","German"],["el","Greek"],["gn","Guarani"],["gu","Gujarati"],["ht","Haitian Creole"],["ha","Hausa"],["haw","Hawaiian"],["iw","Hebrew"],["hi","Hindi"],["hmn","Hmong"],["hu","Hungarian"],["is","Icelandic"],["ig","Igbo"],["ilo","Ilocano"],["id","Indonesian"],["ga","Irish"],["it","Italian"],["ja","Japanese"],["jv","Javanese"],["kn","Kannada"],["kk","Kazakh"],["km","Khmer"],["rw","Kinyarwanda"],["gom","Konkani"],["ko","Korean"],["kri","Krio"],["ku","Kurdish"],["ky","Kyrgyz"],["lo","Lao"],["la","Latin"],["lv","Latvian"],["ln","Lingala"],["lt","Lithuanian"],["lg","Luganda"],["lb","Luxembourgish"],["mk","Macedonian"],["mai","Maithili"],["mg","Malagasy"],["ms","Malay"],["ml","Malayalam"],["mt","Maltese"],["mi","Maori"],["mr","Marathi"],["mni-Mtei","Meiteilon"],["lus","Mizo"],["mn","Mongolian"],["ne","Nepali"],["no","Norwegian"],["ny","Nyanja"],["or","Odia"],["om","Oromo"],["ps","Pashto"],["fa","Persian"],["pl","Polish"],["pt","Portuguese"],["pa","Punjabi"],["qu","Quechua"],["ro","Romanian"],["ru","Russian"],["sm","Samoan"],["sa","Sanskrit"],["gd","Scots Gaelic"],["nso","Sepedi"],["sr","Serbian"],["st","Sesotho"],["sn","Shona"],["sd","Sindhi"],["si","Sinhala"],["sk","Slovak"],["sl","Slovenian"],["so","Somali"],["es","Spanish"],["su","Sundanese"],["sw","Swahili"],["sv","Swedish"],["tg","Tajik"],["ta","Tamil"],["tt","Tatar"],["te","Telugu"],["th","Thai"],["ti","Tigrinya"],["ts","Tsonga"],["tr","Turkish"],["tk","Turkmen"],["ak","Twi"],["uk","Ukrainian"],["ur","Urdu"],["ug","Uyghur"],["uz","Uzbek"],["vi","Vietnamese"],["cy","Welsh"],["xh","Xhosa"],["yi","Yiddish"],["yo","Yoruba"],["zu","Zulu"]
] as const;
const originalText = new WeakMap<Text,string>();
const trackedNodes = new Set<Text>();
const translationCache = new Map<string,string>();
const ignoredTags = new Set(["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","INPUT","SELECT","OPTION","CODE","PRE","SVG"]);

export default function LanguageTools() {
 const [language,setLanguage]=useState("de");
 const [ready,setReady]=useState(false);
 const [open,setOpen]=useState(false);
 const [query,setQuery]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{
  const saved=localStorage.getItem("moonbot-language");
  const browser=(navigator.language||"en").toLowerCase();
  const detected=browser.startsWith("zh")?(browser.includes("tw")||browser.includes("hk")?"zh-TW":"zh-CN"):browser.split("-")[0];
  setLanguage(saved || (LANGUAGES.some(([code])=>code===detected)?detected:"en"));
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
     if(!response.ok)throw new Error(response.status===503?"Übersetzungsdienst ist noch nicht eingerichtet":"Übersetzung fehlgeschlagen");
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
 const currentName=LANGUAGES.find(([code])=>code===language)?.[1]??language;
 return <div className="moonLanguage" data-no-translate>
  <button className="moonLanguageButton" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>🌐 <span>{currentName}</span> <span>⌄</span></button>
  {open&&<div className="moonLanguageMenu"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Sprache suchen …" aria-label="Sprache suchen"/><div className="moonLanguageList">{LANGUAGES.filter(([,name])=>name.toLowerCase().includes(query.toLowerCase())).map(([code,name])=><button key={code} className="moonLanguageOption" onClick={()=>{setLanguage(code);setOpen(false);setQuery("");}}>{name}{language===code?" ✓":""}</button>)}</div></div>}
  {error&&<span className="moonLanguageStatus">{error}. GOOGLE_TRANSLATE_API_KEY in Vercel erforderlich.</span>}
 </div>;
}
