import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "VerityPulse — The Intelligence Platform for True Crime Creators",
  description:
    "Discover high-opportunity cases, analyze your channel, and beat competitors with evidence-backed intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body
        className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}