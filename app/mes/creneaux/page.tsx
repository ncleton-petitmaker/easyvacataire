"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Unplug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AvailabilityCalendar,
  type Slot,
  type BusySlot,
} from "@/components/calendar/availability-calendar";
import { useSearchParams } from "next/navigation";

type Creneau = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  session_type: string;
  matieres: { name: string; code: string | null } | null;
};

export default function MesCreneauxPage() {
  const searchParams = useSearchParams();
  const [intervenantId, setIntervenantId] = useState<string | null>(null);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Handle Google OAuth return
  useEffect(() => {
    const google = searchParams.get("google");
    if (google === "connected") {
      toast.success("Google Agenda connecté !");
      window.history.replaceState({}, "", "/mes/creneaux");
    } else if (google === "error") {
      toast.error("Erreur lors de la connexion à Google Agenda");
      window.history.replaceState({}, "", "/mes/creneaux");
    }
  }, [searchParams]);

  const loadBusySlots = useCallback(
    async (intervId: string) => {
      const now = new Date();
      const from = format(startOfMonth(now), "yyyy-MM-dd");
      const to = format(endOfMonth(addMonths(now, 2)), "yyyy-MM-dd");
      try {
        const res = await fetch(
          `/api/calendar/freebusy?intervenant_id=${intervId}&from=${from}&to=${to}`
        );
        const data = await res.json();
        setGoogleConnected(data.connected === true);
        if (Array.isArray(data.busy)) setBusySlots(data.busy);
      } catch {
        // silently fail
      }
    },
    []
  );

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: intervenant } = await supabase
        .from("intervenants")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!intervenant) {
        setLoading(false);
        return;
      }

      setIntervenantId(intervenant.id);

      const [creneauxRes, dispoRes] = await Promise.all([
        fetch(
          `/api/creneaux?intervenant_id=${intervenant.id}&status=confirme,realise`
        ),
        fetch(`/api/disponibilites?intervenant_id=${intervenant.id}`),
      ]);

      const creneauxData = await creneauxRes.json();
      const dispoData = await dispoRes.json();

      if (Array.isArray(creneauxData)) setCreneaux(creneauxData);
      if (Array.isArray(dispoData)) {
        setSlots(
          dispoData.map(
            (d: {
              id: string;
              date: string;
              heure_debut: string;
              heure_fin: string;
            }) => ({
              id: d.id,
              date: d.date,
              heure_debut: d.heure_debut,
              heure_fin: d.heure_fin,
            })
          )
        );
      }

      // Fetch Google busy slots
      await loadBusySlots(intervenant.id);
    } catch {
      toast.error("Erreur lors du chargement");
    }
    setLoading(false);
  }, [loadBusySlots]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddSlot(slot: Omit<Slot, "id">) {
    if (!intervenantId) return;
    const res = await fetch("/api/disponibilites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...slot,
        intervenant_id: intervenantId,
        source: "web",
      }),
    });
    if (!res.ok) {
      toast.error("Erreur lors de l'enregistrement");
      return;
    }
    toast.success("Disponibilité enregistrée");
    load();
  }

  async function handleRemoveSlot(slotId: string) {
    const res = await fetch(`/api/disponibilites?id=${slotId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    load();
  }

  async function handleDisconnectGoogle() {
    const res = await fetch("/api/google-calendar/disconnect", {
      method: "POST",
    });
    if (res.ok) {
      setGoogleConnected(false);
      setBusySlots([]);
      toast.success("Google Agenda déconnecté");
    } else {
      toast.error("Erreur lors de la déconnexion");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-[#4243C4]" />
        <p className="mt-3 text-sm text-muted-foreground">
          Chargement du planning...
        </p>
      </div>
    );
  }

  if (!intervenantId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Impossible de charger votre profil.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mon planning</h1>
          <p className="text-sm text-muted-foreground">
            Ajoutez vos disponibilités et consultez vos créneaux confirmés.
          </p>
        </div>
        {googleConnected ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Google Agenda connecté
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={handleDisconnectGoogle}
            >
              <Unplug className="size-3 mr-1" />
              Déconnecter
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = "/api/google-calendar/connect";
            }}
          >
            <svg className="size-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Connecter Google Agenda
          </Button>
        )}
      </div>

      {/* Créneaux confirmés */}
      {creneaux.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="text-sm font-semibold text-emerald-800 mb-2">
            {creneaux.length} créneau{creneaux.length > 1 ? "x" : ""} confirmé
            {creneaux.length > 1 ? "s" : ""}
          </h2>
          <div className="space-y-1">
            {creneaux.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 text-sm text-emerald-700"
              >
                <span className="font-medium">
                  {format(new Date(c.date + "T00:00:00"), "EEE d MMM")}
                </span>
                <span>
                  {c.heure_debut}-{c.heure_fin}
                </span>
                <span className="text-emerald-600/70">
                  [{c.session_type || "TD"}]{" "}
                  {c.matieres?.name || "Cours"}
                  {c.salle ? ` · ${c.salle}` : ""}
                </span>
              </div>
            ))}
            {creneaux.length > 5 && (
              <p className="text-xs text-emerald-600/70 mt-1">
                + {creneaux.length - 5} autre
                {creneaux.length - 5 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Disponible
        </span>
        {googleConnected && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Occupé (Google)
          </span>
        )}
      </div>

      {/* Calendrier */}
      <AvailabilityCalendar
        slots={slots}
        busySlots={busySlots}
        onAddSlot={handleAddSlot}
        onRemoveSlot={handleRemoveSlot}
      />
    </div>
  );
}
