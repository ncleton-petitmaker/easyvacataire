"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/index.css";
import { CalendarDays, Loader2 } from "lucide-react";

type Creneau = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  matieres: { name: string; code: string | null } | null;
};

export default function MesCreneauxPage() {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsService] = useState(() => createEventsServicePlugin());

  useEffect(() => {
    async function load() {
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

        const today = format(new Date(), "yyyy-MM-dd");
        const res = await fetch(
          `/api/creneaux?intervenant_id=${intervenant.id}&from=${today}`
        );
        const data = await res.json();
        if (Array.isArray(data)) setCreneaux(data);
      } catch {
        // Silently fail
      }
      setLoading(false);
    }
    load();
  }, []);

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
    if (!eventsService || loading) return;
    try {
      eventsService.set(calendarEvents);
    } catch {
      // eventsService might not be ready yet
    }
  }, [calendarEvents, eventsService, loading]);

  const calendar = useCalendarApp({
    locale: "fr-FR",
    firstDayOfWeek: 1,
    defaultView: "week",
    selectedDate: format(new Date(), "yyyy-MM-dd"),
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon planning</h1>
        <p className="text-sm text-muted-foreground">
          {creneaux.length > 0
            ? `${creneaux.length} créneau${creneaux.length > 1 ? "x" : ""} à venir`
            : "Vos créneaux confirmés apparaîtront sur ce calendrier."}
        </p>
      </div>

      <div
        className="rounded-xl border border-border bg-card overflow-hidden"
        style={{ height: "calc(100vh - 200px)", minHeight: "400px" }}
      >
        <ScheduleXCalendar calendarApp={calendar} />
      </div>
    </div>
  );
}
