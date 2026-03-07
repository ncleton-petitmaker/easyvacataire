"use client";

import { useState, useEffect } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, MapPin } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

        // R\u00e9cup\u00e9rer l'intervenant li\u00e9 \u00e0 cet utilisateur
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

  const upcoming = creneaux.filter(
    (c) => !isBefore(new Date(c.date), startOfDay(new Date()))
  );

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Mon planning</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Mon planning</h1>

      {upcoming.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun cours programm\u00e9 prochainement.
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Vos prochains cr\u00e9neaux appara\u00eetront ici d\u00e8s qu&apos;ils seront confirm\u00e9s.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcoming.map((c) => {
            const dateObj = new Date(c.date + "T00:00:00");
            const isToday =
              format(dateObj, "yyyy-MM-dd") ===
              format(new Date(), "yyyy-MM-dd");

            return (
              <Card
                key={c.id}
                className={
                  isToday
                    ? "border-primary/30 bg-primary/5"
                    : undefined
                }
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {c.matieres?.name || "Cours"}
                    {c.matieres?.code && (
                      <Badge variant="secondary">{c.matieres.code}</Badge>
                    )}
                    {isToday && <Badge>Aujourd&apos;hui</Badge>}
                  </CardTitle>
                  <CardAction>
                    <span className="text-lg font-semibold">
                      {c.heure_debut} - {c.heure_fin}
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {format(dateObj, "EEEE d MMMM yyyy", { locale: fr })}
                    </span>
                    {c.salle && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        Salle {c.salle}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
