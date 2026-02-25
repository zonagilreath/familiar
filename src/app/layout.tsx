import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Familiar — D&D Encounter Assistant",
  description: "AI-powered encounter builder for D&D 5e dungeon masters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-950 text-stone-100 antialiased">
        {children}
      </body>
    </html>
  );
}
