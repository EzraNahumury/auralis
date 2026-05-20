import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/sections/hero";
import { HowAuralis } from "@/components/sections/how-auralis";
import { WhatYouCanDo } from "@/components/sections/what-you-can-do";
import { SecurityIntegrations } from "@/components/sections/security-integrations";
import { FAQ } from "@/components/sections/faq";
import { Academy } from "@/components/sections/academy";
import { StartCTA } from "@/components/sections/start-cta";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <Hero />
        <HowAuralis />
        <WhatYouCanDo />
        <SecurityIntegrations />
        <FAQ />
        <Academy />
        <StartCTA />
      </main>
      <Footer />
    </>
  );
}
