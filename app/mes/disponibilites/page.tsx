"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import {
  AvailabilityCalendar,
  type Slot,
} from "@/components/calendar/availability-calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MesDisponibilitesPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [intervenantId, setIntervenantId] = useState<string | null>(null);

  // R\u00e9cup\u00e9rer l'identifiant intervenant depuis la session Supabase
  useEffect(() => {
    async function fetchIntervenantId() {
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

        if (intervenant) {
          setIntervenantId(intervenant.id);
        } else {
          setLoading(false);
        }
      } catch {
        toast.error("Impossible de r\u00e9cup\u00e9rer votre profil.");
        setLoading(false);
      }
    }
    fetchIntervenantId();
  }, []);

  const load = useCallback(async () => {
    if (!intervenantId) return;
    try {
      const res = await fetch(
        `/api/disponibilites?intervenant_id=${intervenantId}`
      );
      const data = await res.json();
      if (Array.isArray(data)) setSlots(data);
    } catch {
      toast.error("Erreur lors du chargement des disponibilit\u00e9s.");
    }
    setLoading(false);
  }, [intervenantId]);

  useEffect(() => {
    if (intervenantId) load();
  }, [intervenantId, load]);

  async function handleAddSlot(slot: Omit<Slot, "id">) {
    if (!intervenantId) return;
    try {
      const res = await fetch("/api/disponibilites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...slot, intervenant_id: intervenantId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Disponibilit\u00e9 ajout\u00e9e avec succ\u00e8s.");
      load();
    } catch {
      toast.error("Impossible d\u2019ajouter cette disponibilit\u00e9.");
    }
  }

  async function handleRemoveSlot(slotId: string) {
    try {
      const res = await fetch(`/api/disponibilites?id=${slotId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Disponibilit\u00e9 supprim\u00e9e.");
      load();
    } catch {
      toast.error("Impossible de supprimer cette disponibilit\u00e9.");
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Mes disponibilit\u00e9s</h1>
        <Card>
          <CardContent className="space-y-4 py-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!intervenantId) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Mes disponibilit\u00e9s</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Identifiant intervenant non trouv\u00e9. Veuillez vous reconnecter.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Mes disponibilit\u00e9s</h1>

      <Card>
        <CardHeader>
          <CardTitle>Calendrier de disponibilit\u00e9s</CardTitle>
          <CardDescription>
            S\u00e9lectionnez les jours et horaires o\u00f9 vous \u00eates disponible pour
            intervenir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityCalendar
            slots={slots}
            onAddSlot={handleAddSlot}
            onRemoveSlot={handleRemoveSlot}
          />
        </CardContent>
      </Card>
    </div>
  );
}
