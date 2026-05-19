import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/sections/hero";
import { HowAuralis } from "@/components/sections/how-auralis";
import { WhatYouCanDo } from "@/components/sections/what-you-can-do";
import { SecurityIntegrations } from "@/components/sections/security-integrations";
import { Problem } from "@/components/sections/problem";
import { Showcase } from "@/components/sections/showcase";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Preview } from "@/components/sections/preview";
import { Agents } from "@/components/sections/agents";
import { Reputation } from "@/components/sections/reputation";
import { Impact } from "@/components/sections/impact";
import { CTA } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <Hero />
        <HowAuralis />
        <WhatYouCanDo />
        <SecurityIntegrations />
        <Problem />
        <Showcase />
        <Features />
        <HowItWorks />
        <Preview />
        <Agents />
        <Reputation />
        <Impact />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
