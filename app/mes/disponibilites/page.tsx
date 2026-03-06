"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AvailabilityCalendar,
  type Slot,
} from "@/components/calendar/availability-calendar";

export default function MesDisponibilitesPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO: get from session
  const intervenantId = typeof window !== "undefined"
    ? localStorage.getItem("uniplanning_intervenant_id")
    : null;

  const load = useCallback(async () => {
    if (!intervenantId) {
      setLoading(false);
      return;
    }
    const res = await fetch(
      `/api/disponibilites?intervenant_id=${intervenantId}`
    );
    const data = await res.json();
    if (Array.isArray(data)) setSlots(data);
    setLoading(false);
  }, [intervenantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddSlot(slot: Omit<Slot, "id">) {
    if (!intervenantId) return;
    await fetch("/api/disponibilites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...slot, intervenant_id: intervenantId }),
    });
    load();
  }

  async function handleRemoveSlot(slotId: string) {
    await fetch(`/api/disponibilites?id=${slotId}`, { method: "DELETE" });
    load();
  }

  if (loading) {
    return <div className="text-zinc-500">Chargement...</div>;
  }

  if (!intervenantId) {
    return (
      <div className="text-zinc-500">
        Identifiant intervenant non trouvé. Reconnectez-vous.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          Mes disponibilités
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sélectionnez les jours et horaires où vous êtes disponible pour
          intervenir.
        </p>
      </div>

      <AvailabilityCalendar
        slots={slots}
        onAddSlot={handleAddSlot}
        onRemoveSlot={handleRemoveSlot}
      />
    </div>
  );
}
