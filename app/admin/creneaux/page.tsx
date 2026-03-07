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
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarClock,
  MapPin,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(
    0,
    6
  ); // Lun-Sam

  const load = useCallback(async () => {
    if (!etablissementId) return;
    setLoading(true);
    const from = format(weekStart, "yyyy-MM-dd");
    const to = format(weekEnd, "yyyy-MM-dd");
    const res = await fetch(
      `/api/creneaux?etablissement_id=${etablissementId}&from=${from}&to=${to}`
    );
    const data = await res.json();
    if (Array.isArray(data)) setCreneaux(data);
    setLoading(false);
  }, [etablissementId, weekStart, weekEnd]);

  useEffect(() => {
    load();
  }, [load]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h-19h

  function getCreneauxForDay(day: Date) {
    const dayStr = format(day, "yyyy-MM-dd");
    return creneaux.filter((c) => c.date === dayStr);
  }

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      setCurrentWeek(date);
      setCalendarOpen(false);
    }
  }

  if (!etablissementId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucun etablissement selectionne.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tete avec navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CalendarClock className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Planning</h1>
            <p className="text-sm text-muted-foreground">
              Vue hebdomadaire des creneaux confirmes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              <CalendarDays className="size-4 text-muted-foreground" />
              <span>
                {format(weekStart, "d MMM", { locale: fr })} -{" "}
                {format(weekEnd, "d MMM yyyy", { locale: fr })}
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentWeek}
                onSelect={handleDateSelect}
                locale={fr}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>

          <Button
            variant="secondary"
            size="default"
            onClick={() => setCurrentWeek(new Date())}
          >
            Aujourd&apos;hui
          </Button>
        </div>
      </div>

      {/* Grille du planning */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-4">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Skeleton key={j} className="h-12 w-full" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-[60px_repeat(6,1fr)] min-w-[800px]">
                {/* En-tete des jours */}
                <div className="border-b border-border bg-muted/30 p-2" />
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`border-b border-l border-border p-3 text-center text-sm font-semibold transition-colors ${
                      isSameDay(day, new Date())
                        ? "bg-primary/5 text-primary"
                        : "bg-muted/30 text-foreground"
                    }`}
                  >
                    <span className="capitalize">
                      {format(day, "EEEE", { locale: fr })}
                    </span>
                    <span
                      className={`ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isSameDay(day, new Date())
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                ))}

                {/* Grille horaire */}
                {hours.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="flex items-start justify-end border-b border-border/50 bg-muted/20 px-2 pt-1 text-xs font-medium text-muted-foreground">
                      {hour}h00
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
                          className={`relative min-h-[56px] border-b border-l border-border/50 transition-colors hover:bg-muted/20 ${
                            isSameDay(day, new Date()) ? "bg-primary/[0.02]" : ""
                          }`}
                        >
                          {hourCr.map((c) => (
                            <div
                              key={c.id}
                              className="absolute inset-x-1 top-1 rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs shadow-sm transition-shadow hover:shadow-md"
                            >
                              <div className="flex items-center gap-1 font-semibold text-primary">
                                {c.matieres?.name || "Cours"}
                                {c.matieres?.code && (
                                  <Badge variant="secondary" className="ml-1 text-[9px] px-1 h-4">
                                    {c.matieres.code}
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                                <CalendarClock className="size-3" />
                                {c.heure_debut} - {c.heure_fin}
                              </div>
                              {c.salle && (
                                <div className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="size-3" />
                                  {c.salle}
                                </div>
                              )}
                              {c.intervenants && (
                                <div className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                                  <User className="size-3" />
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
          )}
        </CardContent>
      </Card>

      {/* Message si aucun creneau */}
      {creneaux.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">
                Aucun creneau confirme cette semaine
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Les creneaux apparaitront ici une fois confirmes via le matching.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
