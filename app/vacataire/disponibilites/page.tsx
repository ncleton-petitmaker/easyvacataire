"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AvailabilityCalendar,
  type Slot,
} from "@/components/calendar/availability-calendar";

type IntervenantInfo = {
  id: string;
  first_name: string;
};

export default function VacataireDisponibilitesPage() {
  const [intervenant, setIntervenant] = useState<IntervenantInfo | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

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

      const { data: interv } = await supabase
        .from("intervenants")
        .select("id, first_name")
        .eq("user_id", user.id)
        .single();

      if (!interv) {
        setLoading(false);
        return;
      }

      setIntervenant(interv);

      const res = await fetch(`/api/disponibilites?intervenant_id=${interv.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSlots(
          data.map((d: { id: string; date: string; heure_debut: string; heure_fin: string }) => ({
            id: d.id,
            date: d.date,
            heure_debut: d.heure_debut,
            heure_fin: d.heure_fin,
          }))
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
    if (!intervenant) return;
    const res = await fetch("/api/disponibilites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...slot,
        intervenant_id: intervenant.id,
        source: "web",
      }),
    });
    if (!res.ok) {
      toast.error("Erreur lors de l'enregistrement");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        <p className="mt-3 text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!intervenant) {
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes disponibilités</h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez les jours et horaires où vous êtes disponible pour intervenir.
        </p>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700">
          Disponibilité enregistrée !
        </div>
      )}

      <AvailabilityCalendar
        slots={slots}
        onAddSlot={handleAddSlot}
        onRemoveSlot={handleRemoveSlot}
      />
    </div>
  );
}
