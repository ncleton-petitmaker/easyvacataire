"use client";

import { useState } from "react";

const besoins = [
  { jour: "Mardi 11", heure: "14h - 16h", matiere: "UX Design", salle: "B204" },
  { jour: "Jeudi 13", heure: "09h - 12h", matiere: "Dev Web", salle: "A102" },
  { jour: "Mardi 18", heure: "14h - 16h", matiere: "UX Design", salle: "B204" },

];

const dispos = [
  { jour: "Lundi 10", heure: "14h - 18h" },
  { jour: "Mardi 11", heure: "13h - 17h" },
  { jour: "Jeudi 13", heure: "08h - 13h" },
  { jour: "Mardi 18", heure: "14h - 17h" },
];

export function MatchDemo() {
  const [matched, setMatched] = useState(false);

  const matches = [0, 1, 2]; // indices in besoins that match

  return (
    <section className="bg-zinc-50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Matching
          </p>
          <h2 className="text-3xl font-bold text-zinc-900 md:text-4xl">
            Trouvez le match parfait.
          </h2>
          <p className="mt-4 text-zinc-500">
            L&apos;établissement renseigne ses besoins, le vacataire ses
            disponibilités. EasyVacataire trouve les créneaux communs.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-[1fr_auto_1fr]">
          {/* Besoins */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              Besoins de l&apos;établissement
            </h3>
            <div className="space-y-3">
              {besoins.map((b, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3 transition-all duration-500 ${
                    matched && matches.includes(i)
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-zinc-100 bg-zinc-50"
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-800">
                    {b.jour} — {b.heure}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {b.matiere} | Salle {b.salle}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Match button */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setMatched(!matched)}
              className={`group flex h-16 w-16 items-center justify-center rounded-full transition-all duration-500 ${
                matched
                  ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                  : "bg-indigo-600 shadow-lg shadow-indigo-600/25 hover:bg-indigo-700"
              }`}
            >
              {matched ? (
                <svg
                  className="h-7 w-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-7 w-7 text-white transition group-hover:scale-110"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Disponibilités */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <span className="h-3 w-3 rounded-full bg-blue-400" />
              Disponibilités du vacataire
            </h3>
            <div className="space-y-3">
              {dispos.map((d, i) => {
                const isMatch = matched && [1, 2, 3].includes(i);
                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 transition-all duration-500 ${
                      isMatch
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-zinc-100 bg-zinc-50"
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-800">
                      {d.jour} — {d.heure}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Match result */}
        <div
          className={`mx-auto mt-8 max-w-md overflow-hidden transition-all duration-700 ${
            matched ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-6 text-center">
            <p className="text-lg font-bold text-emerald-800">
              3 matchs trouvés
            </p>
            <p className="mt-1 text-sm text-emerald-600">
              Mardi 11, Jeudi 13 et Mardi 18 — Confirmez en un clic.
            </p>
          </div>
        </div>

        {matched && (
          <p className="mt-4 text-center text-xs text-zinc-400">
            Cliquez à nouveau sur le bouton pour réinitialiser
          </p>
        )}
      </div>
    </section>
  );
}
