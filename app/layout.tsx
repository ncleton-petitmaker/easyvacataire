import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/cookie-consent";
import { Toaster } from "@/components/ui/sonner";
import TemporalPolyfill from "@/components/temporal-polyfill";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EasyVacataire - Simplifiez la gestion de vos intervenants vacataires",
    template: "%s | EasyVacataire",
  },
  description:
    "EasyVacataire simplifie la gestion des intervenants vacataires en universite. Synchronisez les disponibilites, planifiez les creneaux et automatisez le matching entre professionnels et besoins de votre etablissement via WhatsApp.",
  keywords: [
    "vacataire",
    "intervenant",
    "universite",
    "gestion vacataires",
    "planning universitaire",
    "disponibilites",
    "matching automatique",
    "WhatsApp",
    "enseignement superieur",
    "gestion intervenants",
    "planification cours",
    "EasyVacataire",
  ],
  authors: [{ name: "EasyVacataire" }],
  creator: "EasyVacataire",
  metadataBase: new URL("https://easyvacataire.fr"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "EasyVacataire - Simplifiez la gestion de vos intervenants vacataires",
    description:
      "Synchronisez les disponibilites des professionnels avec les besoins de votre etablissement. Planning, WhatsApp, matching automatique.",
    url: "https://easyvacataire.fr",
    siteName: "EasyVacataire",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyVacataire - Simplifiez la gestion de vos intervenants vacataires",
    description:
      "Synchronisez les disponibilites des professionnels avec les besoins de votre etablissement. Planning, WhatsApp, matching automatique.",
  },
  other: {
    "theme-color": "#2563eb",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TemporalPolyfill />
        {children}
        <CookieConsent />
        <Toaster richColors />
      </body>
    </html>
  );
}
