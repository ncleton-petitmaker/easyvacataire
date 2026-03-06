"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Petit délai pour l'animation d'apparition
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleConsent(value: "accepted" | "refused") {
    localStorage.setItem("cookie-consent", value);
    setVisible(false);
  }

  // Ne rien rendre si le consentement existe déjà
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShouldRender(true);
    }
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      }`}
      onTransitionEnd={() => {
        if (!visible && localStorage.getItem("cookie-consent")) {
          setShouldRender(false);
        }
      }}
    >
      <div className="mx-auto max-w-4xl px-4 pb-4">
        <div className="rounded-t-2xl border-t border-zinc-200 bg-white px-6 py-5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600 sm:max-w-md">
              Ce site utilise des cookies essentiels au fonctionnement du
              service. En continuant, vous acceptez leur utilisation.{" "}
              <Link
                href="/politique-de-confidentialite"
                className="underline underline-offset-2 text-zinc-900 hover:text-zinc-700"
              >
                En savoir plus
              </Link>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
              <button
                onClick={() => handleConsent("refused")}
                className="cursor-pointer rounded-lg border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Refuser
              </button>
              <button
                onClick={() => handleConsent("accepted")}
                className="cursor-pointer rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
