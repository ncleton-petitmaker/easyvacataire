"use client";

import { useState, useEffect, useCallback } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { fr } from "date-fns/locale";

type Creneau = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  status: string;
  intervenants: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  matieres: { id: string; name: string; code: string | null } | null;
};

export default function CreneauxPage() {
  const [etablissementId] = useEtablissementId();
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(
    0,
    6
  ); // Lun-Sam

  const load = useCallback(async () => {
    if (!etablissementId) return;
    const from = format(weekStart, "yyyy-MM-dd");
    const to = format(weekEnd, "yyyy-MM-dd");
    const res = await fetch(
      `/api/creneaux?etablissement_id=${etablissementId}&from=${from}&to=${to}`
    );
    const data = await res.json();
    if (Array.isArray(data)) setCreneaux(data);
  }, [etablissementId, weekStart, weekEnd]);

  useEffect(() => {
    load();
  }, [load]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h-19h

  function getCreneauxForDay(day: Date) {
    const dayStr = format(day, "yyyy-MM-dd");
    return creneaux.filter((c) => c.date === dayStr);
  }

  if (!etablissementId) {
    return <div className="text-zinc-500">Aucun établissement sélectionné.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Planning
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            &larr; Semaine précédente
          </button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {format(weekStart, "d MMM", { locale: fr })} -{" "}
            {format(weekEnd, "d MMM yyyy", { locale: fr })}
          </span>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Semaine suivante &rarr;
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm dark:bg-zinc-700"
          >
            Aujourd&apos;hui
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-[60px_repeat(6,1fr)] min-w-[800px]">
          {/* Header */}
          <div className="border-b border-zinc-200 p-2 dark:border-zinc-800" />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`border-b border-l border-zinc-200 p-2 text-center text-sm font-medium dark:border-zinc-800 ${
                isSameDay(day, new Date())
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {format(day, "EEE d", { locale: fr })}
            </div>
          ))}

          {/* Time grid */}
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="border-b border-zinc-100 p-1 text-right text-xs text-zinc-400 dark:border-zinc-800">
                {hour}h
              </div>
              {days.map((day) => {
                const dayCr = getCreneauxForDay(day);
                const hourCr = dayCr.filter((c) => {
                  const h = parseInt(c.heure_debut.split(":")[0]);
                  return h === hour;
                });

                return (
                  <div
                    key={day.toISOString() + hour}
                    className="relative min-h-[48px] border-b border-l border-zinc-100 dark:border-zinc-800"
                  >
                    {hourCr.map((c) => (
                      <div
                        key={c.id}
                        className="absolute inset-x-1 top-0.5 rounded-md bg-blue-100 p-1.5 text-xs dark:bg-blue-900/40"
                      >
                        <div className="font-medium text-blue-800 dark:text-blue-300">
                          {c.matieres?.name || "Cours"}
                        </div>
                        <div className="text-blue-600 dark:text-blue-400">
                          {c.heure_debut}-{c.heure_fin}
                          {c.salle && ` | ${c.salle}`}
                        </div>
                        {c.intervenants && (
                          <div className="text-blue-500 dark:text-blue-500">
                            {c.intervenants.first_name}{" "}
                            {c.intervenants.last_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {creneaux.length === 0 && (
        <p className="mt-4 text-center text-sm text-zinc-400">
          Aucun créneau confirmé cette semaine
        </p>
      )}
    </div>
  );
}
