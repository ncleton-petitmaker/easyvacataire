"use client";

import { useState, useEffect, useCallback } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";

type MatchItem = {
  besoin: {
    id: string;
    date: string;
    heure_debut: string;
    heure_fin: string;
    salle: string | null;
    notes: string | null;
    matiere: { id: string; name: string; code: string | null } | null;
  };
  intervenants: {
    id: string;
    first_name: string;
    last_name: string;
    specialite: string | null;
    dispo_id: string;
  }[];
};

export default function MatchingPage() {
  const [etablissementId] = useEtablissementId();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [confetti, setConfetti] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!etablissementId) return;
    setLoading(true);
    const res = await fetch(
      `/api/matching?etablissement_id=${etablissementId}`
    );
    const data = await res.json();
    if (Array.isArray(data)) setMatches(data);
    setLoading(false);
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirm(besoinId: string, intervenantId: string) {
    setConfirming(besoinId);
    const res = await fetch("/api/matching", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ besoin_id: besoinId, intervenant_id: intervenantId }),
    });

    if (res.ok) {
      setConfirmed((prev) => new Set(prev).add(besoinId));
      setConfetti(besoinId);
      setTimeout(() => setConfetti(null), 2000);
      // Reload after animation
      setTimeout(() => load(), 2500);
    }
    setConfirming(null);
  }

  const matchesWithIntervenants = matches.filter(
    (m) => m.intervenants.length > 0
  );
  const matchesWithout = matches.filter((m) => m.intervenants.length === 0);

  if (!etablissementId) {
    return <div className="text-zinc-500">Aucun établissement sélectionné.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Matching disponibilités
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Trouvez les créneaux communs entre vos besoins et les disponibilités
            des intervenants.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
        >
          {loading ? "Chargement..." : "Rafraîchir"}
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-2xl font-bold text-zinc-900">{matches.length}</p>
          <p className="text-xs text-zinc-500">Besoins ouverts</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-2xl font-bold text-emerald-700">
            {matchesWithIntervenants.length}
          </p>
          <p className="text-xs text-emerald-600">Avec match possible</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-2xl font-bold text-amber-700">
            {matchesWithout.length}
          </p>
          <p className="text-xs text-amber-600">Sans match</p>
        </div>
      </div>

      {/* Matches with intervenants */}
      {matchesWithIntervenants.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">
            Matchs disponibles
          </h2>
          <div className="space-y-4">
            {matchesWithIntervenants.map((match) => {
              const isConfirmed = confirmed.has(match.besoin.id);
              const showConfetti = confetti === match.besoin.id;

              return (
                <div
                  key={match.besoin.id}
                  className={`relative overflow-hidden rounded-2xl border transition-all duration-700 ${
                    isConfirmed
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  {/* Confetti overlay */}
                  {showConfetti && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                      <div className="flex gap-2">
                        {["bg-emerald-400", "bg-amber-400", "bg-indigo-400", "bg-rose-400", "bg-cyan-400"].map(
                          (color, i) => (
                            <span
                              key={i}
                              className={`h-3 w-3 rounded-full ${color} animate-confetti`}
                              style={{
                                animationDelay: `${i * 0.1}s`,
                                transform: `rotate(${i * 72}deg) translateY(-${20 + i * 8}px)`,
                              }}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                    {/* Besoin info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${isConfirmed ? "bg-emerald-200" : "bg-amber-100"}`}>
                          <svg
                            className={`h-5 w-5 ${isConfirmed ? "text-emerald-700" : "text-amber-700"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900">
                            {match.besoin.date} — {match.besoin.heure_debut} à{" "}
                            {match.besoin.heure_fin}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {match.besoin.matiere?.name || "Cours"}
                            {match.besoin.matiere?.code &&
                              ` (${match.besoin.matiere.code})`}
                            {match.besoin.salle &&
                              ` — Salle ${match.besoin.salle}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Match arrow */}
                    <div className="hidden md:flex">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${
                          isConfirmed
                            ? "bg-emerald-500 scale-110"
                            : "bg-indigo-100"
                        }`}
                      >
                        {isConfirmed ? (
                          <svg
                            className="h-5 w-5 text-white"
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
                            className="h-5 w-5 text-indigo-600"
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
                      </div>
                    </div>

                    {/* Available intervenants */}
                    <div className="flex-1">
                      {isConfirmed ? (
                        <p className="text-center text-sm font-semibold text-emerald-700">
                          Créneau confirmé !
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {match.intervenants.map((interv) => (
                            <div
                              key={interv.id}
                              className="flex items-center justify-between rounded-xl bg-blue-50 p-3"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold text-indigo-800">
                                  {interv.first_name[0]}
                                  {interv.last_name[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-800">
                                    {interv.first_name} {interv.last_name}
                                  </p>
                                  {interv.specialite && (
                                    <p className="text-[10px] text-zinc-500">
                                      {interv.specialite}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleConfirm(match.besoin.id, interv.id)
                                }
                                disabled={confirming === match.besoin.id}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {confirming === match.besoin.id
                                  ? "..."
                                  : "Confirmer"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Besoins without matches */}
      {matchesWithout.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">
            Besoins sans match
          </h2>
          <div className="space-y-2">
            {matchesWithout.map((match) => (
              <div
                key={match.besoin.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {match.besoin.date} — {match.besoin.heure_debut} à{" "}
                    {match.besoin.heure_fin}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {match.besoin.matiere?.name || "Cours"}
                    {match.besoin.salle && ` — Salle ${match.besoin.salle}`}
                  </p>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">
                  Aucun intervenant disponible
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && !loading && (
        <div className="rounded-2xl border border-zinc-200 bg-white py-16 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
            <svg
              className="h-8 w-8 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
          <p className="text-zinc-500">Aucun besoin ouvert pour le moment.</p>
          <p className="mt-1 text-sm text-zinc-400">
            Ajoutez des besoins et invitez les intervenants à donner leurs dispos.
          </p>
        </div>
      )}
    </div>
  );
}
