import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { Solution } from "@/components/landing/solution";
import { MatchDemo } from "@/components/landing/match-demo";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Mission } from "@/components/landing/mission";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { StructuredData } from "@/components/structured-data";

export const metadata: Metadata = {
  title: "EasyVacataire - Simplifiez la gestion de vos intervenants vacataires",
  description:
    "EasyVacataire est la solution pour les universites qui simplifie la planification des vacataires : matching automatique, gestion des disponibilites et communication via WhatsApp.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <StructuredData />
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <MatchDemo />
      <HowItWorks />
      <Testimonials />
      <Mission />
      <Footer />
    </main>
  );
}
