'use client';

import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { GamesShowcase } from '@/components/landing/GamesShowcase';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CTA } from '@/components/landing/CTA';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <main>
        <Hero />
        <Features />
        <GamesShowcase />
        <HowItWorks />
        <CTA />
      </main>
    </div>
  );
}
