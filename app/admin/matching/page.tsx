"use client";

import { useState, useEffect, useCallback } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";
import { toast } from "sonner";
import {
  Shuffle,
  RefreshCw,
  CalendarDays,
  MapPin,
  CheckCircle2,
  ArrowRightLeft,
  AlertCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export default function MatchingPage() {
  const [etablissementId] = useEtablissementId();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [confetti, setConfetti] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!etablissementId) return;
    setLoading(true);
    const res = await fetch(
      `/api/matching?etablissement_id=${etablissementId}`
    );
    const data = await res.json();
    if (Array.isArray(data)) setMatches(data);
    setLoading(false);
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirm(besoinId: string, intervenantId: string, intervenantName: string) {
    setConfirming(besoinId);
    const res = await fetch("/api/matching", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ besoin_id: besoinId, intervenant_id: intervenantId }),
    });

    if (res.ok) {
      setConfirmed((prev) => new Set(prev).add(besoinId));
      setConfetti(besoinId);
      toast.success("Creneau confirme", {
        description: `${intervenantName} a ete assigne(e) avec succes.`,
      });
      setTimeout(() => setConfetti(null), 2000);
      // Recharger apres l'animation
      setTimeout(() => load(), 2500);
    } else {
      toast.error("Erreur", {
        description: "Impossible de confirmer ce creneau. Veuillez reessayer.",
      });
    }
    setConfirming(null);
  }

  const matchesWithIntervenants = matches.filter(
    (m) => m.intervenants.length > 0
  );
  const matchesWithout = matches.filter((m) => m.intervenants.length === 0);

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
      {/* En-tete */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shuffle className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Matching disponibilites
            </h1>
            <p className="text-sm text-muted-foreground">
              Trouvez les creneaux communs entre vos besoins et les disponibilites
              des intervenants.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Chargement..." : "Rafraichir"}
        </Button>
      </div>

      {/* Statistiques */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <CalendarDays className="size-6 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{matches.length}</p>
                <p className="text-xs text-muted-foreground">Besoins ouverts</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {matchesWithIntervenants.length}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                  Avec match possible
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="size-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {matchesWithout.length}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Sans match
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Squelettes de chargement */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Matchs disponibles */}
      {!loading && matchesWithIntervenants.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Matchs disponibles</h2>
            <Badge variant="secondary">
              {matchesWithIntervenants.length}
            </Badge>
          </div>

          <div className="space-y-4">
            {matchesWithIntervenants.map((match) => {
              const isConfirmed = confirmed.has(match.besoin.id);
              const showConfetti = confetti === match.besoin.id;

              return (
                <Card
                  key={match.besoin.id}
                  className={`relative overflow-hidden transition-all duration-700 ${
                    isConfirmed
                      ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/10"
                      : ""
                  }`}
                >
                  {/* Animation de confirmation */}
                  {showConfetti && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                      <div className="flex gap-2">
                        {["bg-emerald-400", "bg-amber-400", "bg-indigo-400", "bg-rose-400", "bg-cyan-400"].map(
                          (color, i) => (
                            <span
                              key={i}
                              className={`h-3 w-3 rounded-full ${color} animate-confetti`}
                              style={{
                                animationDelay: `${i * 0.1}s`,
                                transform: `rotate(${i * 72}deg) translateY(-${20 + i * 8}px)`,
                              }}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      {/* Informations du besoin */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isConfirmed
                                ? "bg-emerald-200 dark:bg-emerald-800"
                                : "bg-amber-100 dark:bg-amber-900/40"
                            }`}
                          >
                            <CalendarDays
                              className={`size-5 ${
                                isConfirmed
                                  ? "text-emerald-700 dark:text-emerald-300"
                                  : "text-amber-700 dark:text-amber-300"
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">
                                {match.besoin.date}
                              </p>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="size-3" />
                                {match.besoin.heure_debut} - {match.besoin.heure_fin}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {match.besoin.matiere && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="size-3" />
                                  {match.besoin.matiere.name}
                                  {match.besoin.matiere.code && (
                                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">
                                      {match.besoin.matiere.code}
                                    </Badge>
                                  )}
                                </span>
                              )}
                              {match.besoin.salle && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3" />
                                  Salle {match.besoin.salle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fleche de liaison */}
                      <div className="hidden md:flex">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${
                            isConfirmed
                              ? "scale-110 bg-emerald-500"
                              : "bg-primary/10"
                          }`}
                        >
                          {isConfirmed ? (
                            <CheckCircle2 className="size-5 text-white" />
                          ) : (
                            <ArrowRightLeft className="size-5 text-primary" />
                          )}
                        </div>
                      </div>

                      {/* Intervenants disponibles */}
                      <div className="flex-1">
                        {isConfirmed ? (
                          <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/20">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                              Creneau confirme !
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {match.intervenants.map((interv) => (
                              <div
                                key={interv.id}
                                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar size="default">
                                    <AvatarFallback>
                                      {interv.first_name[0]}
                                      {interv.last_name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {interv.first_name} {interv.last_name}
                                    </p>
                                    {interv.specialite && (
                                      <Badge variant="secondary" className="mt-0.5 text-[10px]">
                                        {interv.specialite}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleConfirm(
                                      match.besoin.id,
                                      interv.id,
                                      `${interv.first_name} ${interv.last_name}`
                                    )
                                  }
                                  disabled={confirming === match.besoin.id}
                                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                  {confirming === match.besoin.id ? (
                                    <RefreshCw className="size-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="size-3" />
                                  )}
                                  {confirming === match.besoin.id
                                    ? "..."
                                    : "Confirmer"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Besoins sans match */}
      {!loading && matchesWithout.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Besoins sans match</h2>
            <Badge variant="destructive">
              {matchesWithout.length}
            </Badge>
          </div>

          <Card>
            <CardContent className="divide-y divide-border p-0">
              {matchesWithout.map((match) => (
                <div
                  key={match.besoin.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <CalendarDays className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {match.besoin.date}
                        </p>
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Clock className="size-3" />
                          {match.besoin.heure_debut} - {match.besoin.heure_fin}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {match.besoin.matiere?.name || "Cours"}
                        {match.besoin.salle && ` — Salle ${match.besoin.salle}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">
                    <AlertCircle className="size-3" />
                    Aucun intervenant disponible
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Etat vide */}
      {matches.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">Aucun besoin ouvert pour le moment.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajoutez des besoins et invitez les intervenants a donner leurs
                disponibilites.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
