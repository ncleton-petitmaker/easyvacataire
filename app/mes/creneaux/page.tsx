"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const MesCreneauxCalendar = dynamic(
  () => import("@/components/mes-creneaux-calendar"),
  { ssr: false }
);

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

      <MesCreneauxCalendar creneaux={creneaux} />
    </div>
  );
}
