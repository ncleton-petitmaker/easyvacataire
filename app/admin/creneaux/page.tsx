"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";
import { toast } from "sonner";
import { Calendar } from "@/components/calendar/calendar";
import type { CalendarEvent } from "@/components/calendar/types";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  CalendarDays,
  X,
  Loader2,
  User,
  BookOpen,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { format } from "date-fns";
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

type Matiere = { id: string; name: string; code: string | null };

export default function CreneauxPage() {
  const [etablissementId] = useEtablissementId();
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [besoins, setBesoins] = useState<Besoin[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);

  // Create besoin dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    date: "",
    heure_debut: "08:00",
    heure_fin: "10:00",
    matiere_id: "",
    salle: "",
    notes: "",
  });

  // Match panel
  const [selectedBesoinId, setSelectedBesoinId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    if (!etablissementId) return;
    setLoading(true);

    try {
      const [creneauxRes, besoinsRes, matchesRes, matieresRes] = await Promise.all([
        fetch(`/api/creneaux?etablissement_id=${etablissementId}`),
        fetch(`/api/besoins?etablissement_id=${etablissementId}&status=ouvert`),
        fetch(`/api/matching?etablissement_id=${etablissementId}`),
        fetch(`/api/matieres?etablissement_id=${etablissementId}`),
      ]);

      const creneauxData = await creneauxRes.json();
      const besoinsData = await besoinsRes.json();
      const matchesData = await matchesRes.json();
      const matieresData = await matieresRes.json();

      if (Array.isArray(creneauxData)) setCreneaux(creneauxData);
      if (Array.isArray(besoinsData)) setBesoins(besoinsData);
      if (Array.isArray(matchesData)) setMatches(matchesData);
      if (Array.isArray(matieresData)) setMatieres(matieresData);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  // Build calendar events from creneaux + besoins
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = [];

    // Confirmed creneaux → green
    for (const c of creneaux) {
      events.push({
        id: `creneau-${c.id}`,
        title: `${c.matieres?.name || "Cours"}${c.intervenants ? ` · ${c.intervenants.first_name} ${c.intervenants.last_name[0]}.` : ""}`,
        start: new Date(`${c.date}T${c.heure_debut}`),
        end: new Date(`${c.date}T${c.heure_fin}`),
        color: "emerald",
      });
    }

    // Open besoins
    for (const b of besoins) {
      const match = matches.find((m) => m.besoin.id === b.id);
      const hasMatch = (match?.intervenants.length ?? 0) > 0;
      events.push({
        id: `besoin-${b.id}`,
        title: `${b.matieres?.name || "Besoin"}${hasMatch ? ` (${match!.intervenants.length} dispo)` : ""}`,
        start: new Date(`${b.date}T${b.heure_debut}`),
        end: new Date(`${b.date}T${b.heure_fin}`),
        color: hasMatch ? "indigo" : "amber",
      });
    }

    return events;
  }, [creneaux, besoins, matches]);

  // Match helpers
  function getMatchForBesoin(besoinId: string): MatchItem | undefined {
    return matches.find((m) => m.besoin.id === besoinId);
  }

  const selectedBesoin = selectedBesoinId
    ? besoins.find((b) => b.id === selectedBesoinId)
    : null;
  const selectedMatch = selectedBesoinId ? getMatchForBesoin(selectedBesoinId) : null;

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

  async function handleCreateBesoin(e: React.FormEvent) {
    e.preventDefault();
    if (!etablissementId) return;
    try {
      const res = await fetch("/api/besoins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etablissement_id: etablissementId,
          matiere_id: createForm.matiere_id || undefined,
          date: createForm.date,
          heure_debut: createForm.heure_debut,
          heure_fin: createForm.heure_fin,
          salle: createForm.salle || undefined,
          notes: createForm.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Besoin créé avec succès");
      setShowCreateDialog(false);
      load();
    } catch {
      toast.error("Impossible de créer le besoin");
    }
  }

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planning</h1>
          <p className="text-sm text-muted-foreground">
            Cliquez sur un créneau vide pour créer un besoin. Cliquez sur un besoin pour assigner un intervenant.
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateForm({
              date: format(new Date(), "yyyy-MM-dd"),
              heure_debut: "08:00",
              heure_fin: "10:00",
              matiere_id: "",
              salle: "",
              notes: "",
            });
            setShowCreateDialog(true);
          }}
          className="bg-[#4243C4] hover:bg-[#3234A0] text-white"
        >
          <Plus className="size-4" />
          Nouveau besoin
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" />
          <span className="text-muted-foreground">Confirmé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#4243C4]" />
          <span className="text-muted-foreground">Match possible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" />
          <span className="text-muted-foreground">Sans match</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calendar */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-xl border border-border bg-card overflow-hidden"
            style={{ height: "calc(100vh - 220px)", minHeight: "400px" }}
          >
            <Calendar
              events={calendarEvents}
              onEventClick={(event) => {
                if (event.id.startsWith("besoin-")) {
                  const besoinId = event.id.replace("besoin-", "");
                  setSelectedBesoinId(besoinId);
                }
              }}
              onSlotClick={(date, hour) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const endH = hour + 2;
                setCreateForm({
                  date: dateStr,
                  heure_debut: `${String(hour).padStart(2, "0")}:00`,
                  heure_fin: `${String(endH).padStart(2, "0")}:00`,
                  matiere_id: "",
                  salle: "",
                  notes: "",
                });
                setShowCreateDialog(true);
              }}
            />
          </div>
        </div>

        {/* Match panel (right side on desktop, below on mobile) */}
        {selectedBesoin && (
          <Card className="w-full lg:w-80 lg:shrink-0 lg:self-start lg:sticky lg:top-6">
            <CardContent className="p-4 space-y-4">
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
              </div>

              <div className="h-px bg-border" />

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Intervenants disponibles
                </h4>

                {!selectedMatch || selectedMatch.intervenants.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 py-6 text-center">
                    <AlertCircle className="mx-auto mb-2 size-6 text-amber-500" />
                    <p className="text-sm font-medium text-amber-700">
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

      {/* Create besoin dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau besoin</DialogTitle>
            <DialogDescription>
              Définissez le créneau à pourvoir par un vacataire.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBesoin} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-date"
                  type="date"
                  value={createForm.date}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-debut">
                  Début <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-debut"
                  type="time"
                  value={createForm.heure_debut}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, heure_debut: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-fin">
                  Fin <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-fin"
                  type="time"
                  value={createForm.heure_fin}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, heure_fin: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matière</Label>
                <Select
                  value={createForm.matiere_id}
                  onValueChange={(val) =>
                    setCreateForm({ ...createForm, matiere_id: val ?? "" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    {matieres.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.code ? `${m.code} - ` : ""}
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-salle">Salle</Label>
                <Input
                  id="create-salle"
                  placeholder="Ex : B204"
                  value={createForm.salle}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, salle: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-notes">Notes</Label>
              <Input
                id="create-notes"
                placeholder="Informations complémentaires"
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm({ ...createForm, notes: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <DialogClose>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-[#4243C4] hover:bg-[#3234A0] text-white">
                Créer le besoin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
