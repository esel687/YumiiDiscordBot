import type { Metadata } from "next";
import "./globals.css";
import LanguageTools from "../components/LanguageTools";
export const metadata: Metadata = { title: "MoonBot Dashboard", description: "Verwalte deine Discord-Server mit MoonBot." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="de"><body>{children}<LanguageTools /></body></html>;
}
