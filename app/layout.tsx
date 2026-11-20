import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "MoonBot Dashboard",
  description: "Verwalte deine Discord-Server mit MoonBot."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
