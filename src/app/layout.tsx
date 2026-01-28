import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Navigation } from "@/components/layout/Navigation";
import { DevTools } from "@/components/DevTools";
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
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          // Primary color for buttons and links
          colorPrimary: "#ffffff",
          // Dark backgrounds matching design system
          colorBackground: "#09090b",
          colorInputBackground: "#18181b",
          colorInputText: "#fafafa",
          colorText: "#fafafa",
          colorTextSecondary: "#a1a1aa",
          // Border styling
          colorNeutral: "#27272a",
          // Danger/error states
          colorDanger: "#ef4444",
          // Font settings
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          borderRadius: "0.75rem",
        },
        elements: {
          // Global element overrides for all Clerk components
          card: "bg-zinc-950 border border-zinc-800/50 shadow-2xl",
          socialButtonsBlockButton:
            "bg-white hover:bg-zinc-100 text-black font-medium transition-all duration-200",
          socialButtonsBlockButtonText: "text-black font-semibold",
          formButtonPrimary:
            "bg-white hover:bg-zinc-100 text-black font-medium transition-colors",
          footerActionLink: "text-zinc-400 hover:text-white transition-colors",
          userButtonPopoverCard: "bg-zinc-950 border border-zinc-800",
          userButtonPopoverActionButton:
            "text-zinc-400 hover:text-white hover:bg-zinc-900",
          userButtonPopoverActionButtonText: "text-zinc-400",
          userButtonPopoverActionButtonIcon: "text-zinc-500",
          userButtonPopoverFooter: "hidden",
          userPreviewMainIdentifier: "text-white font-medium",
          userPreviewSecondaryIdentifier: "text-zinc-500",
          avatarBox: "border-2 border-zinc-700",
        },
      }}
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg-primary text-text-primary`}
          suppressHydrationWarning
        >
          <ConvexClientProvider>
            <Navigation />
            {children}
          </ConvexClientProvider>
          <DevTools />
        </body>
      </html>
    </ClerkProvider>
  );
}
