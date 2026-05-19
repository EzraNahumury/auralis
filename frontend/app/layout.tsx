import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Space_Grotesk } from "next/font/google";
import { LenisProvider } from "@/components/providers/lenis-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auralis — AI-governed Arisan on Portaldot",
  description:
    "Auralis turns Indonesia's rotating savings tradition into a transparent, AI-governed onchain coordination protocol. Built natively on Portaldot with ink! smart contracts and POT gas.",
  metadataBase: new URL("https://auralis.dev"),
  openGraph: {
    title: "Auralis — AI-governed Arisan on Portaldot",
    description:
      "Multi-agent reasoning evaluates every withdrawal request; the chain enforces the verdict.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="relative min-h-full overflow-x-hidden bg-bg text-fg">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 bg-noise opacity-[0.05] mix-blend-overlay"
        />
        <LenisProvider>
          <div className="relative z-10">{children}</div>
        </LenisProvider>
      </body>
    </html>
  );
}
