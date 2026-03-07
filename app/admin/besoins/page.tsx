"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  XCircle,
  Upload,
  CalendarDays,
} from "lucide-react";

type Matiere = { id: string; name: string; code: string | null };
type Besoin = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  notes: string | null;
  status: string;
  matieres: Matiere | null;
};

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  ouvert: { label: "Ouvert", variant: "default" },
  attribue: { label: "Attribué", variant: "secondary" },
  annule: { label: "Annulé", variant: "outline" },
};

export default function BesoinsPage() {
  const [etablissementId] = useEtablissementId();
  const [besoins, setBesoins] = useState<Besoin[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    date: "",
    heure_debut: "08:00",
    heure_fin: "10:00",
    matiere_id: "",
    salle: "",
    notes: "",
  });

  const load = useCallback(async () => {
    if (!etablissementId) return;
    setLoading(true);
    try {
      const [besoinsRes, matieresRes] = await Promise.all([
        fetch(`/api/besoins?etablissement_id=${etablissementId}`),
        fetch(`/api/matieres?etablissement_id=${etablissementId}`),
      ]);
      const besoinsData = await besoinsRes.json();
      const matieresData = await matieresRes.json();
      if (Array.isArray(besoinsData)) setBesoins(besoinsData);
      if (Array.isArray(matieresData)) setMatieres(matieresData);
    } finally {
      setLoading(false);
    }
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return besoins;
    const q = search.toLowerCase();
    return besoins.filter(
      (b) =>
        b.date.includes(q) ||
        b.salle?.toLowerCase().includes(q) ||
        b.notes?.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q) ||
        b.matieres?.name.toLowerCase().includes(q) ||
        b.matieres?.code?.toLowerCase().includes(q)
    );
  }, [besoins, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!etablissementId) return;
    try {
      const res = await fetch("/api/besoins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etablissement_id: etablissementId,
          matiere_id: form.matiere_id || undefined,
          date: form.date,
          heure_debut: form.heure_debut,
          heure_fin: form.heure_fin,
          salle: form.salle || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      toast.success("Besoin créé avec succès");
      setForm({
        date: "",
        heure_debut: "08:00",
        heure_fin: "10:00",
        matiere_id: "",
        salle: "",
        notes: "",
      });
      setShowForm(false);
      load();
    } catch {
      toast.error("Impossible de créer le besoin");
    }
  }

  async function handleCancel(id: string) {
    try {
      const res = await fetch(`/api/besoins/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de l'annulation");
      toast.success("Besoin annulé");
      setCancelId(null);
      load();
    } catch {
      toast.error("Impossible d'annuler le besoin");
      setCancelId(null);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !etablissementId) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("etablissement_id", etablissementId);
      formData.append("type", "besoins");
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const result = await res.json();
      toast.success(`${result.imported} besoin(s) importé(s)`);
      if (result.errors?.length) {
        toast.warning(`${result.errors.length} erreur(s) lors de l'import`);
      }
      load();
    } catch {
      toast.error("Erreur lors de l'import du fichier CSV");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  if (!etablissementId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucun établissement sélectionné.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Besoins en créneaux
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez les créneaux à pourvoir par des vacataires.
          </p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <Button variant="outline" disabled={importing} render={<span />}>
              <Upload />
              {importing ? "Import en cours..." : "Importer CSV"}
            </Button>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
              disabled={importing}
            />
          </label>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <Button onClick={() => setShowForm(true)}>
              <Plus />
              Ajouter un besoin
            </Button>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouveau besoin</DialogTitle>
                <DialogDescription>
                  Définissez le créneau à pourvoir.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heure_debut">
                      Début <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="heure_debut"
                      type="time"
                      value={form.heure_debut}
                      onChange={(e) =>
                        setForm({ ...form, heure_debut: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heure_fin">
                      Fin <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="heure_fin"
                      type="time"
                      value={form.heure_fin}
                      onChange={(e) =>
                        setForm({ ...form, heure_fin: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Matière (optionnel)</Label>
                    <Select
                      value={form.matiere_id}
                      onValueChange={(val) =>
                        setForm({ ...form, matiere_id: val ?? "" })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner une matière" />
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
                    <Label htmlFor="salle">Salle</Label>
                    <Input
                      id="salle"
                      placeholder="Ex : B204"
                      value={form.salle}
                      onChange={(e) =>
                        setForm({ ...form, salle: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Informations complémentaires"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
                <DialogFooter>
                  <DialogClose>
                    <Button type="button" variant="outline">
                      Annuler
                    </Button>
                  </DialogClose>
                  <Button type="submit">Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des besoins</CardTitle>
              <CardDescription>
                {besoins.length} besoin{besoins.length > 1 ? "s" : ""}{" "}
                enregistré{besoins.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un besoin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="mb-4 size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                {search
                  ? "Aucun besoin ne correspond à votre recherche."
                  : "Aucun besoin enregistré."}
              </p>
              {!search && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Cliquez sur &laquo; Ajouter un besoin &raquo; ou importez un
                  fichier CSV pour commencer.
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Horaire</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Salle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => {
                  const cfg = statusConfig[b.status];
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.date}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.heure_debut} - {b.heure_fin}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.matieres
                          ? `${b.matieres.code ? b.matieres.code + " - " : ""}${b.matieres.name}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.salle || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg?.variant ?? "outline"}>
                          {cfg?.label ?? b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {b.status === "ouvert" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setCancelId(b.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <XCircle />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler ce besoin ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le créneau sera marqué comme annulé et ne sera plus proposé aux
              vacataires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => cancelId && handleCancel(cancelId)}
            >
              Annuler le besoin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
