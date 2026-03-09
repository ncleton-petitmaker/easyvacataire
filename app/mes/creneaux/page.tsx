"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AvailabilityCalendar,
  type Slot,
} from "@/components/calendar/availability-calendar";

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
  const [intervenantId, setIntervenantId] = useState<string | null>(null);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch {
      toast.error("Erreur lors du chargement");
    }
    setLoading(false);
  }, []);

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

  // Build creneaux display grouped by date
  const creneauxByDate = new Map<string, Creneau[]>();
  for (const c of creneaux) {
    if (!creneauxByDate.has(c.date)) creneauxByDate.set(c.date, []);
    creneauxByDate.get(c.date)!.push(c);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon planning</h1>
        <p className="text-sm text-muted-foreground">
          Ajoutez vos disponibilités et consultez vos créneaux confirmés.
        </p>
      </div>

      {/* Créneaux confirmés à venir */}
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
                  {format(
                    new Date(c.date + "T00:00:00"),
                    "EEE d MMM"
                  )}
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
                + {creneaux.length - 5} autre{creneaux.length - 5 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Calendrier de disponibilités */}
      <AvailabilityCalendar
        slots={slots}
        onAddSlot={handleAddSlot}
        onRemoveSlot={handleRemoveSlot}
      />
    </div>
  );
}
