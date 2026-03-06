"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  AvailabilityCalendar,
  type Slot,
} from "@/components/calendar/availability-calendar";

type IntervenantInfo = {
  id: string;
  first_name: string;
  last_name: string;
} | null;

export default function PublicDisposPage() {
  const params = useParams();
  const token = params.token as string;

  const [intervenant, setIntervenant] = useState<IntervenantInfo>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/disponibilites/public?token=${token}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Lien invalide ou expiré");
      setLoading(false);
      return;
    }
    setIntervenant(data.intervenant);
    setSlots(data.slots);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddSlot(slot: Omit<Slot, "id">) {
    if (!intervenant) return;
    await fetch("/api/disponibilites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...slot,
        intervenant_id: intervenant.id,
        source: "web",
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  }

  async function handleRemoveSlot(slotId: string) {
    await fetch(`/api/disponibilites?id=${slotId}`, { method: "DELETE" });
    load();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9]">
        <p className="text-zinc-500">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-800">{error}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Demandez un nouveau lien à votre établissement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] py-10">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3">
            <img src="/logo.svg" alt="EasyVacataire" className="h-6" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Bonjour {intervenant?.first_name} !
          </h1>
          <p className="mt-2 text-zinc-500">
            Indiquez vos disponibilités en sélectionnant les jours et horaires
            qui vous conviennent.
          </p>
        </div>

        {/* Success toast */}
        {saved && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700">
            Disponibilité enregistrée !
          </div>
        )}

        <AvailabilityCalendar
          slots={slots}
          onAddSlot={handleAddSlot}
          onRemoveSlot={handleRemoveSlot}
        />
      </div>
    </div>
  );
}
