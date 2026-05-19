import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full overflow-x-hidden bg-bg text-fg">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 bg-noise opacity-[0.04] mix-blend-overlay"
        />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
