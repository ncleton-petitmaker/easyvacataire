"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, X, Loader2, Calendar, Clock, MapPin, BookOpen } from "lucide-react";

type DemandeInfo = {
  id: string;
  status: string;
  besoins_etablissement: {
    date: string;
    heure_debut: string;
    heure_fin: string;
    salle: string | null;
    session_type: string | null;
    matieres: { name: string } | null;
  };
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DemandePage() {
  const params = useParams();
  const token = params.token as string;

  const [demande, setDemande] = useState<DemandeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/demandes/by-token?token=${token}`);
        if (res.ok) {
          setDemande(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function respond(accepted: boolean) {
    setResponding(true);
    try {
      const res = await fetch("/api/demandes/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, accepted }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: "Erreur de connexion." });
    } finally {
      setResponding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAFAF9]">
        <Loader2 className="size-8 animate-spin text-[#4243C4]" />
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAFAF9] p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <X className="mx-auto size-12 text-red-400" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Lien invalide ou expiré
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Cette demande n&apos;existe plus ou a déjà été traitée.
          </p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAFAF9] p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          {result.success ? (
            <Check className="mx-auto size-12 text-green-500" />
          ) : (
            <X className="mx-auto size-12 text-amber-500" />
          )}
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            {result.success ? "Réponse enregistrée" : "Information"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">{result.message}</p>
        </div>
      </div>
    );
  }

  if (demande.status !== "sent") {
    const statusLabels: Record<string, string> = {
      accepted: "Vous avez déjà accepté ce créneau.",
      refused: "Vous avez déjà refusé ce créneau.",
      expired: "Cette demande a expiré.",
      pending: "Cette demande n'a pas encore été envoyée.",
    };
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAFAF9] p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <h1 className="mt-4 text-xl font-bold text-gray-900">Demande traitée</h1>
          <p className="mt-2 text-sm text-gray-500">
            {statusLabels[demande.status] || "Cette demande n'est plus active."}
          </p>
        </div>
      </div>
    );
  }

  const besoin = demande.besoins_etablissement;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#FAFAF9] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg overflow-hidden">
        <div
          className="px-6 py-5 text-white"
          style={{
            background: "linear-gradient(135deg, #4243C4 0%, #3234A0 100%)",
          }}
        >
          <h1 className="text-lg font-bold">Demande de disponibilité</h1>
          <p className="mt-1 text-sm text-white/70">
            L&apos;établissement vous propose un créneau
          </p>
        </div>

        <div className="p-6 space-y-4">
          {besoin.matieres?.name && (
            <div className="flex items-center gap-3">
              <BookOpen className="size-5 text-[#4243C4] shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Matière</p>
                <p className="font-semibold text-gray-900">
                  {besoin.matieres.name}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Calendar className="size-5 text-[#4243C4] shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-semibold text-gray-900">
                {formatDate(besoin.date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="size-5 text-[#4243C4] shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Horaire</p>
              <p className="font-semibold text-gray-900">
                {besoin.heure_debut} — {besoin.heure_fin}
              </p>
            </div>
          </div>

          {besoin.salle && (
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-[#4243C4] shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Salle</p>
                <p className="font-semibold text-gray-900">{besoin.salle}</p>
              </div>
            </div>
          )}

          {besoin.session_type && (
            <div className="mt-2">
              <span className="inline-block rounded-full bg-[#4243C4]/10 px-3 py-1 text-xs font-medium text-[#4243C4]">
                {besoin.session_type}
              </span>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-5">
          <p className="mb-4 text-center text-sm font-medium text-gray-700">
            Êtes-vous disponible pour ce créneau ?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => respond(false)}
              disabled={responding}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              {responding ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <X className="size-4" />
              )}
              Refuser
            </button>
            <button
              onClick={() => respond(true)}
              disabled={responding}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {responding ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
