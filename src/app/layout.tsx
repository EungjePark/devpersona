import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevPersona - Discover Your Developer Archetype",
  description: "Analyze your GitHub, npm, and Hacker News presence to discover your developer personality type. FIFA-style cards with tier system.",
  keywords: ["developer", "github", "analysis", "personality", "archetype", "npm", "hacker news"],
  authors: [{ name: "DevPersona" }],
  openGraph: {
    title: "DevPersona - Discover Your Developer Archetype",
    description: "What kind of developer are you? Get your FIFA-style developer card.",
    type: "website",
    siteName: "DevPersona",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevPersona - Discover Your Developer Archetype",
    description: "What kind of developer are you? Get your FIFA-style developer card.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg-primary text-text-primary`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
