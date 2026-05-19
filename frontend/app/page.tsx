import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { Solution } from "@/components/sections/solution";
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
        <Problem />
        <Solution />
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
