"use client";

import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import {
  Check,
  X,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Inbox,
} from "lucide-react";

type Demande = {
  id: string;
  status: string;
  response_token: string;
  sent_at: string | null;
  expires_at: string | null;
  besoins_etablissement: {
    date: string;
    heure_debut: string;
    heure_fin: string;
    salle: string | null;
    session_type: string | null;
    matieres: { name: string; code: string | null } | null;
  };
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function VacataireDemandesPage() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [intervenantId, setIntervenantId] = useState<string | null>(null);

  const loadDemandes = useCallback(async (intId: string) => {
    const res = await fetch(`/api/demandes?intervenant_id=${intId}`);
    if (res.ok) {
      setDemandes(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: intervenant } = await supabase
        .from("intervenants")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (intervenant) {
        setIntervenantId(intervenant.id);
        await loadDemandes(intervenant.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, [loadDemandes]);

  async function respond(demande: Demande, accepted: boolean) {
    setResponding(demande.id);
    try {
      await fetch("/api/demandes/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: demande.response_token,
          accepted,
        }),
      });
      if (intervenantId) {
        await loadDemandes(intervenantId);
      }
    } catch {
      // ignore
    } finally {
      setResponding(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#4243C4]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">
        Demandes de disponibilité
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Créneaux proposés par votre établissement
      </p>

      {demandes.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <Inbox className="size-16 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-500">
            Aucune demande en attente
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Vous recevrez une notification WhatsApp quand un créneau vous sera
            proposé.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {demandes.map((d) => {
            const besoin = d.besoins_etablissement;
            const isCurrent = d.status === "sent";

            return (
              <div
                key={d.id}
                className={`rounded-xl border bg-white p-5 shadow-sm ${
                  isCurrent
                    ? "border-[#4243C4]/30 ring-2 ring-[#4243C4]/10"
                    : "border-gray-200 opacity-70"
                }`}
              >
                {isCurrent && (
                  <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">
                    En attente de réponse
                  </span>
                )}
                {d.status === "pending" && (
                  <span className="mb-3 inline-block rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-500">
                    Dans la file
                  </span>
                )}

                <div className="space-y-2">
                  {besoin.matieres?.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="size-4 text-[#4243C4]" />
                      <span className="font-semibold">
                        {besoin.matieres.name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-gray-400" />
                    <span>{formatDate(besoin.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-4 text-gray-400" />
                    <span>
                      {besoin.heure_debut} — {besoin.heure_fin}
                    </span>
                  </div>
                  {besoin.salle && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="size-4 text-gray-400" />
                      <span>{besoin.salle}</span>
                    </div>
                  )}
                </div>

                {isCurrent && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => respond(d, false)}
                      disabled={responding === d.id}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {responding === d.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <X className="size-4" />
                      )}
                      Refuser
                    </button>
                    <button
                      onClick={() => respond(d, true)}
                      disabled={responding === d.id}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      {responding === d.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Accepter
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
