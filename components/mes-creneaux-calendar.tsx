"use client";

import { useMemo, useState, useEffect } from "react";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/index.css";

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
  const [eventsService] = useState(() => createEventsServicePlugin());

  const calendarEvents = useMemo(() => {
    return creneaux.map((c) => ({
      id: c.id,
      title: `${c.matieres?.name || "Cours"}${c.salle ? ` - ${c.salle}` : ""}`,
      start: `${c.date} ${c.heure_debut}`,
      end: `${c.date} ${c.heure_fin}`,
      calendarId: "confirmed",
    }));
  }, [creneaux]);

  useEffect(() => {
    if (!eventsService) return;
    try {
      eventsService.set(calendarEvents);
    } catch {
      // eventsService might not be ready yet
    }
  }, [calendarEvents, eventsService]);

  const calendar = useCalendarApp({
    locale: "fr-FR",
    firstDayOfWeek: 1,
    defaultView: "week",
    selectedDate: (globalThis as any).Temporal.Now.plainDateISO(),
    views: [createViewDay(), createViewWeek(), createViewMonthGrid()],
    plugins: [eventsService],
    calendars: {
      confirmed: {
        colorName: "confirmed",
        lightColors: {
          main: "#4243C4",
          container: "#E0E0F7",
          onContainer: "#1E1F6E",
        },
        darkColors: {
          main: "#6366E8",
          container: "#2A2B6E",
          onContainer: "#E0E0F7",
        },
      },
    },
    dayBoundaries: { start: "07:00", end: "21:00" },
    weekOptions: {
      gridHeight: 700,
      nDays: 6,
      eventWidth: 95,
    },
    events: calendarEvents,
  });

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden"
      style={{ height: "calc(100vh - 200px)", minHeight: "400px" }}
    >
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  );
}
