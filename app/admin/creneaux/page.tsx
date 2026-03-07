"use client";

import { useState, useEffect, useCallback } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";
import { toast } from "sonner";
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
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type Besoin = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  notes: string | null;
  status: string;
  matieres: { id: string; name: string; code: string | null } | null;
};

type MatchItem = {
  besoin: {
    id: string;
    date: string;
    heure_debut: string;
    heure_fin: string;
    salle: string | null;
    notes: string | null;
    matiere: { id: string; name: string; code: string | null } | null;
  };
  intervenants: {
    id: string;
    first_name: string;
    last_name: string;
    specialite: string | null;
    dispo_id: string;
  }[];
};

export default function CreneauxPage() {
  const [etablissementId] = useEtablissementId();
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [besoins, setBesoins] = useState<Besoin[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Match panel
  const [selectedBesoinId, setSelectedBesoinId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 6);

  // Stable string keys to avoid infinite re-render loop
  const fromStr = format(weekStart, "yyyy-MM-dd");
  const toStr = format(weekEnd, "yyyy-MM-dd");

  const load = useCallback(async () => {
    if (!etablissementId) return;
    setLoading(true);

    try {
      const [creneauxRes, besoinsRes, matchesRes] = await Promise.all([
        fetch(`/api/creneaux?etablissement_id=${etablissementId}&from=${fromStr}&to=${toStr}`),
        fetch(`/api/besoins?etablissement_id=${etablissementId}&status=ouvert`),
        fetch(`/api/matching?etablissement_id=${etablissementId}`),
      ]);

      const creneauxData = await creneauxRes.json();
      const besoinsData = await besoinsRes.json();
      const matchesData = await matchesRes.json();

      if (Array.isArray(creneauxData)) setCreneaux(creneauxData);
      if (Array.isArray(besoinsData)) setBesoins(besoinsData);
      if (Array.isArray(matchesData)) setMatches(matchesData);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [etablissementId, fromStr, toStr]);

  useEffect(() => {
    load();
  }, [load]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  function getItemsForDayHour(day: Date, hour: number) {
    const dayStr = format(day, "yyyy-MM-dd");

    const dayCreneaux = creneaux.filter(
      (c) => c.date === dayStr && parseInt(c.heure_debut.split(":")[0]) === hour
    );

    const dayBesoins = besoins.filter(
      (b) =>
        b.date === dayStr &&
        parseInt(b.heure_debut.split(":")[0]) === hour &&
        b.status === "ouvert"
    );

    return { creneaux: dayCreneaux, besoins: dayBesoins };
  }

  function getMatchForBesoin(besoinId: string): MatchItem | undefined {
    return matches.find((m) => m.besoin.id === besoinId);
  }

  async function handleConfirm(besoinId: string, intervenantId: string, name: string) {
    setConfirming(true);
    try {
      const res = await fetch("/api/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ besoin_id: besoinId, intervenant_id: intervenantId }),
      });
      if (res.ok) {
        toast.success(`${name} assigné(e) avec succès`);
        setSelectedBesoinId(null);
        load();
      } else {
        toast.error("Erreur lors de la confirmation");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setConfirming(false);
  }

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      setCurrentWeek(date);
      setCalendarOpen(false);
    }
  }

  // Stats
  const weekBesoins = besoins.filter((b) => {
    const from = format(weekStart, "yyyy-MM-dd");
    const to = format(weekEnd, "yyyy-MM-dd");
    return b.date >= from && b.date <= to;
  });
  const weekBesoinsWithMatch = weekBesoins.filter(
    (b) => (getMatchForBesoin(b.id)?.intervenants.length ?? 0) > 0
  );

  // Selected besoin detail panel
  const selectedMatch = selectedBesoinId ? getMatchForBesoin(selectedBesoinId) : null;
  const selectedBesoin = selectedBesoinId
    ? besoins.find((b) => b.id === selectedBesoinId)
    : null;

  if (!etablissementId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucun établissement sélectionné.{" "}
          <a href="/super-admin" className="text-primary underline">
            Choisir un établissement
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CalendarClock className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Planning commun</h1>
            <p className="text-sm text-muted-foreground">
              Besoins, disponibilités et créneaux confirmés
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

      {/* Légende + Stats */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" />
          <span className="text-muted-foreground">Confirmé</span>
          <Badge variant="secondary" className="ml-0.5">{creneaux.length}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" />
          <span className="text-muted-foreground">Besoin ouvert</span>
          <Badge variant="secondary" className="ml-0.5">{weekBesoins.length}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
          <span className="text-muted-foreground">Match possible</span>
          <Badge variant="secondary" className="ml-0.5">{weekBesoinsWithMatch.length}</Badge>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Calendar grid */}
        <Card className="flex-1 overflow-hidden">
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
                  {/* Day headers */}
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
                        {format(day, "EEE", { locale: fr })}
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

                  {/* Hour rows */}
                  {hours.map((hour) => (
                    <div key={hour} className="contents">
                      <div className="flex items-start justify-end border-b border-border/50 bg-muted/20 px-2 pt-1 text-xs font-medium text-muted-foreground">
                        {hour}h
                      </div>
                      {days.map((day) => {
                        const items = getItemsForDayHour(day, hour);

                        return (
                          <div
                            key={day.toISOString() + hour}
                            className={`relative min-h-[60px] border-b border-l border-border/50 transition-colors ${
                              isSameDay(day, new Date()) ? "bg-primary/[0.02]" : ""
                            }`}
                          >
                            {/* Confirmed créneaux */}
                            {items.creneaux.map((c) => (
                              <div
                                key={c.id}
                                className="absolute inset-x-0.5 top-0.5 rounded-md border border-emerald-300 bg-emerald-50 p-1.5 text-[11px] shadow-sm dark:border-emerald-700 dark:bg-emerald-900/30"
                              >
                                <div className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle2 className="size-3 shrink-0" />
                                  {c.matieres?.name || "Cours"}
                                </div>
                                <div className="mt-0.5 text-emerald-600/70 dark:text-emerald-400/70">
                                  {c.heure_debut}-{c.heure_fin}
                                  {c.intervenants && (
                                    <> · {c.intervenants.first_name} {c.intervenants.last_name[0]}.</>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Open besoins */}
                            {items.besoins.map((b) => {
                              const match = getMatchForBesoin(b.id);
                              const hasMatch = (match?.intervenants.length ?? 0) > 0;
                              const isSelected = selectedBesoinId === b.id;

                              return (
                                <div
                                  key={b.id}
                                  onClick={() => setSelectedBesoinId(isSelected ? null : b.id)}
                                  className={`absolute inset-x-0.5 cursor-pointer rounded-md border p-1.5 text-[11px] shadow-sm transition-all ${
                                    isSelected
                                      ? "ring-2 ring-primary border-primary bg-primary/10 z-10"
                                      : hasMatch
                                        ? "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60"
                                        : "border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30"
                                  }`}
                                  style={{
                                    top: `${items.creneaux.length > 0 ? 50 : 2}px`,
                                  }}
                                >
                                  <div className={`flex items-center gap-1 font-semibold ${
                                    hasMatch
                                      ? "text-primary"
                                      : "text-amber-700 dark:text-amber-300"
                                  }`}>
                                    {hasMatch ? (
                                      <User className="size-3 shrink-0" />
                                    ) : (
                                      <AlertCircle className="size-3 shrink-0" />
                                    )}
                                    {b.matieres?.name || "Besoin"}
                                  </div>
                                  <div className={`mt-0.5 ${
                                    hasMatch
                                      ? "text-primary/60"
                                      : "text-amber-600/70 dark:text-amber-400/70"
                                  }`}>
                                    {b.heure_debut}-{b.heure_fin}
                                    {hasMatch && (
                                      <span className="ml-1 font-medium">
                                        · {match!.intervenants.length} dispo
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
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

        {/* Match panel (right side) */}
        {selectedBesoin && (
          <Card className="w-80 shrink-0 self-start sticky top-6">
            <CardContent className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {selectedBesoin.matieres?.name || "Besoin"}
                  </h3>
                  {selectedBesoin.matieres?.code && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {selectedBesoin.matieres.code}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setSelectedBesoinId(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {format(new Date(selectedBesoin.date + "T00:00:00"), "EEEE d MMMM", {
                    locale: fr,
                  })}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3.5" />
                  {selectedBesoin.heure_debut} - {selectedBesoin.heure_fin}
                </div>
                {selectedBesoin.salle && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    Salle {selectedBesoin.salle}
                  </div>
                )}
                {selectedBesoin.notes && (
                  <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                    {selectedBesoin.notes}
                  </p>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Intervenants disponibles */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Intervenants disponibles
                </h4>

                {!selectedMatch || selectedMatch.intervenants.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 py-6 text-center dark:border-amber-700 dark:bg-amber-900/10">
                    <AlertCircle className="mx-auto mb-2 size-6 text-amber-500" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Aucun intervenant disponible
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Invitez les intervenants à renseigner leurs disponibilités.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedMatch.intervenants.map((interv) => (
                      <div
                        key={interv.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {interv.first_name} {interv.last_name}
                          </p>
                          {interv.specialite && (
                            <p className="text-xs text-muted-foreground">
                              {interv.specialite}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          disabled={confirming}
                          onClick={() =>
                            handleConfirm(
                              selectedBesoin.id,
                              interv.id,
                              `${interv.first_name} ${interv.last_name}`
                            )
                          }
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          {confirming ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3" />
                          )}
                          Assigner
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty state */}
      {creneaux.length === 0 && besoins.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">
                Aucun créneau ni besoin cette semaine
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajoutez des besoins dans l&apos;onglet{" "}
                <a href="/admin/besoins" className="text-primary underline">
                  Besoins
                </a>{" "}
                et invitez les intervenants à donner leurs disponibilités.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
