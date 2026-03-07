"use client";

import { useMemo } from "react";
import { Calendar } from "@/components/calendar/calendar";
import type { CalendarEvent } from "@/components/calendar/types";

type Creneau = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  matieres: { name: string; code: string | null } | null;
};

export default function MesCreneauxCalendar({
  creneaux,
}: {
  creneaux: Creneau[];
}) {
  const events: CalendarEvent[] = useMemo(() => {
    return creneaux.map((c) => ({
      id: c.id,
      title: `${c.matieres?.name || "Cours"}${c.salle ? ` - ${c.salle}` : ""}`,
      start: new Date(`${c.date}T${c.heure_debut}`),
      end: new Date(`${c.date}T${c.heure_fin}`),
      color: "indigo",
    }));
  }, [creneaux]);

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden"
      style={{ height: "calc(100vh - 200px)", minHeight: "400px" }}
    >
      <Calendar events={events} readOnly />
    </div>
  );
}
