"use client";

import { useState, useEffect } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

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

  useEffect(() => {
    async function load() {
      const today = format(new Date(), "yyyy-MM-dd");
      // TODO: get intervenant_id from session
      const res = await fetch(`/api/creneaux?from=${today}`);
      const data = await res.json();
      if (Array.isArray(data)) setCreneaux(data);
      setLoading(false);
    }
    load();
  }, []);

  const upcoming = creneaux.filter(
    (c) => !isBefore(new Date(c.date), startOfDay(new Date()))
  );

  if (loading) {
    return <div className="text-zinc-500">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Mon planning
      </h1>

      {upcoming.length === 0 ? (
        <p className="text-zinc-500">Aucun cours programmé prochainement.</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((c) => {
            const dateObj = new Date(c.date + "T00:00:00");
            const isToday =
              format(dateObj, "yyyy-MM-dd") ===
              format(new Date(), "yyyy-MM-dd");

            return (
              <div
                key={c.id}
                className={`rounded-xl border p-4 ${
                  isToday
                    ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {c.matieres?.name || "Cours"}
                      {c.matieres?.code && (
                        <span className="ml-2 text-sm text-zinc-500">
                          ({c.matieres.code})
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {format(dateObj, "EEEE d MMMM", { locale: fr })}
                      {isToday && (
                        <span className="ml-2 rounded-full bg-blue-200 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                          Aujourd&apos;hui
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {c.heure_debut} - {c.heure_fin}
                    </p>
                    {c.salle && (
                      <p className="text-sm text-zinc-500">
                        Salle {c.salle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
