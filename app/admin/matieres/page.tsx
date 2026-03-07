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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, BookOpen } from "lucide-react";

type Matiere = {
  id: string;
  code: string | null;
  name: string;
  volume_horaire_total: number | null;
  description: string | null;
};

export default function MatieresPage() {
  const [etablissementId] = useEtablissementId();
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    code: "",
    name: "",
    volume_horaire_total: "",
    description: "",
  });

  const load = useCallback(async () => {
    if (!etablissementId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/matieres?etablissement_id=${etablissementId}`
      );
      const data = await res.json();
      if (Array.isArray(data)) setMatieres(data);
    } finally {
      setLoading(false);
    }
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return matieres;
    const q = search.toLowerCase();
    return matieres.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
    );
  }, [matieres, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!etablissementId) return;
    try {
      const res = await fetch("/api/matieres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etablissement_id: etablissementId,
          code: form.code || undefined,
          name: form.name,
          volume_horaire_total: form.volume_horaire_total
            ? parseInt(form.volume_horaire_total)
            : undefined,
          description: form.description || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      toast.success("Matière créée avec succès");
      setForm({ code: "", name: "", volume_horaire_total: "", description: "" });
      setShowForm(false);
      load();
    } catch {
      toast.error("Impossible de créer la matière");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/matieres/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      toast.success("Matière supprimée");
      setDeleteId(null);
      load();
    } catch {
      toast.error("Impossible de supprimer la matière");
      setDeleteId(null);
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
            Matières / Modules
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez les matières enseignées dans votre établissement.
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <Button onClick={() => setShowForm(true)}>
            <Plus />
            Ajouter une matière
          </Button>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle matière</DialogTitle>
              <DialogDescription>
                Remplissez les informations de la matière à ajouter.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    placeholder="Ex : INF301"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nom de la matière <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex : Algorithmique"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume horaire (min)</Label>
                  <Input
                    id="volume"
                    type="number"
                    placeholder="Ex : 120"
                    value={form.volume_horaire_total}
                    onChange={(e) =>
                      setForm({ ...form, volume_horaire_total: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Description optionnelle"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des matières</CardTitle>
              <CardDescription>
                {matieres.length} matière{matieres.length > 1 ? "s" : ""}{" "}
                enregistrée{matieres.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une matière..."
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
              <BookOpen className="mb-4 size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                {search
                  ? "Aucune matière ne correspond à votre recherche."
                  : "Aucune matière enregistrée."}
              </p>
              {!search && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Cliquez sur &laquo; Ajouter une matière &raquo; pour
                  commencer.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Volume (h)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono">
                      {m.code ? (
                        <Badge variant="outline">{m.code}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.volume_horaire_total
                        ? `${Math.round(m.volume_horaire_total / 60)}h`
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {m.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteId(m.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette matière ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La matière sera définitivement
              supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
