import Link from "next/link";
import { ArrowLeft, CheckCircle2, Globe2, LayoutDashboard, Smartphone, UserRound, Wrench, ShieldCheck } from "lucide-react";

const updates = [
  {
    date: "22. November 2026",
    title: "Sicherheitsmenü erweitert",
    tag: "Neue Funktionen",
    icon: ShieldCheck,
    items: [
      "Das Menü heißt jetzt Sicherheit und enthält das Ticketsystem sowie KI-Auto-Mod, Anti Spam und Anti Links.",
      "Giveaways können als eigenes Modul aktiviert und mit /moonbot giveaway gestartet werden."
    ]
  },
  {
    date: "22. November 2026",
    title: "Temp Voice & öffentliche Statusseite",
    tag: "Neue Funktion",
    icon: LayoutDashboard,
    items: [
      "Das Voice-Master-Modul wird im Dashboard jetzt als Temp Voice bezeichnet. Es erstellt persönliche Sprachkanäle automatisch, wenn Mitglieder den eingerichteten Startkanal betreten.",
      "Eine öffentliche Statusseite zeigt an, ob MoonBot erreichbar ist."
    ]
  },
  {
    date: "22. November 2026",
    title: "Navigation verbessert",
    tag: "Verbesserung",
    icon: LayoutDashboard,
    items: [
      "Der Changelog ist jetzt direkt über einen eigenen Button in der oberen Navigation erreichbar.",
      "Nicht angemeldete Besucher sehen keinen Dashboard-Button mehr; der Dashboard-Zugang bleibt nach dem Discord-Login verfügbar."
    ]
  },
  {
    date: "22. November 2026",
    title: "Website & Dashboard verbessert",
    tag: "Verbesserung",
    icon: LayoutDashboard,
    items: [
      "Die Website passt sich jetzt besser an PC, Laptop, iPad, Tablet und Smartphone an.",
      "Server, auf denen MoonBot bereits installiert ist, werden getrennt von Servern angezeigt, zu denen du den Bot hinzufügen kannst.",
      "Das Profilmenü bietet eine Abmeldebestätigung. Nach dem Abmelden geht es zurück zur Startseite.",
      "Dein Discord-Anzeigename und Profilbild werden im Konto-Menü verwendet."
    ]
  },
  {
    date: "22. November 2026",
    title: "Mehrsprachigkeit erweitert",
    tag: "Neue Funktion",
    icon: Globe2,
    items: [
      "Die Sprache der Website lässt sich über die Sprachauswahl ändern.",
      "Die Sprachauswahl zeigt Flaggen und bietet eine Suche nach Sprachen.",
      "Die Übersetzung wird über DeepL bereitgestellt, sofern der Dienst korrekt eingerichtet ist."
    ]
  },
  {
    date: "22. November 2026",
    title: "Bedienung und Fehlerseiten",
    tag: "Verbesserung",
    icon: Wrench,
    items: [
      "Die Navigation und Bedienelemente wurden für Touch-Geräte angepasst.",
      "Bei nicht gefundenen Seiten erscheint eine eigene 404-Seite.",
      "Bei unerwarteten Seitenfehlern kannst du den erneuten Ladeversuch starten oder zur Startseite wechseln."
    ]
  },
  {
    date: "22. November 2026",
    title: "Konto-Menü vereinheitlicht",
    tag: "Verbesserung",
    icon: UserRound,
    items: [
      "Das Profilbild öffnet ein Menü mit Abmeldeoption und Sicherheitsabfrage.",
      "Die Kontoanzeige wurde auf Startseite und Serververwaltung vereinheitlicht."
    ]
  }
];

export default function ChangelogPage() {
  return (
    <main className="changelogShell">
      <header className="changelogHeader">
        <Link href="/" className="changelogBack"><ArrowLeft size={16}/> Zur Startseite</Link>
        <span className="changelogBrand">Moon<span>Bot</span></span>
      </header>
      <section className="changelogHero">
        <div className="changelogEyebrow"><Smartphone size={15}/> MOONBOT UPDATES</div>
        <h1>Was gibt’s Neues?</h1>
        <p>Hier findest du wichtige Änderungen und neue Funktionen, die für dich als Nutzer relevant sind.</p>
      </section>
      <section className="changelogTimeline" aria-label="Änderungsverlauf">
        {updates.map((update,index)=>{
          const Icon=update.icon;
          return <article className="changelogEntry" key={update.title}>
            <div className="changelogRail"><span><Icon size={18}/></span>{index!==updates.length-1&&<i/>}</div>
            <div className="changelogCard">
              <div className="changelogMeta"><time>{update.date}</time><span>{update.tag}</span></div>
              <h2>{update.title}</h2>
              <ul>{update.items.map(item=><li key={item}><CheckCircle2 size={15}/><span>{item}</span></li>)}</ul>
            </div>
          </article>;
        })}
      </section>
      <footer className="changelogFooter"><span>MoonBot · Einfach verwalten. Gemeinsam besser.</span><Link href="/datenschutz">Datenschutz</Link><Link href="/impressum">Impressum</Link></footer>
    </main>
  );
}
