"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Brain,
  BookOpen,
} from "lucide-react";

type KnowledgeEntry = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  source_type: string;
  is_active: boolean;
  created_at: string;
};

const categories = [
  { value: "all", label: "Toutes" },
  { value: "campus", label: "Campus" },
  { value: "admin", label: "Procédures admin" },
  { value: "pedagogie", label: "Pédagogie" },
  { value: "faq", label: "FAQ" },
];

const categoryColors: Record<string, string> = {
  campus:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  admin:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  pedagogie:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  faq: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function CategoryBadge({ category }: { category: string | null }) {
  const label =
    categories.find((c) => c.value === category)?.label ?? category ?? "—";
  const colorClass = category ? categoryColors[category] ?? "" : "";

  return (
    <Badge variant="secondary" className={colorClass}>
      {label}
    </Badge>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function KnowledgePage() {
  const [etablissementId] = useEtablissementId();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reindexingIds, setReindexingIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "faq",
  });

  const load = useCallback(async () => {
    if (!etablissementId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/knowledge?etablissement_id=${etablissementId}`
      );
      const data = await res.json();
      if (Array.isArray(data)) setEntries(data);
    } catch {
      toast.error("Erreur lors du chargement des entrées.");
    } finally {
      setLoading(false);
    }
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!etablissementId) return;
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etablissement_id: etablissementId,
          ...form,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Entrée ajoutée avec succès.");
      setForm({ title: "", content: "", category: "faq" });
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Erreur lors de la création de l'entrée.");
    }
  }

  async function handleReindex(id: string) {
    setReindexingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch("/api/knowledge/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledge_id: id }),
      });
      const data = await res.json();
      toast.success(
        `Indexation terminée : ${data.chunks_indexed || 0} chunk(s) indexé(s).`
      );
    } catch {
      toast.error("Erreur lors de l'indexation.");
    } finally {
      setReindexingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Entrée supprimée.");
      load();
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  }

  const filtered = useMemo(() => {
    let result = entries;
    if (filter !== "all") {
      result = result.filter((e) => e.category === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, filter, search]);

  if (!etablissementId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Brain className="mb-4 size-12 opacity-40" />
        <p className="text-sm">Aucun établissement sélectionné.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Base de connaissances
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les informations accessibles par l&apos;assistant IA.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="size-4" />
              Ajouter une entrée
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle entrée</DialogTitle>
              <DialogDescription>
                Ajoutez une information à la base de connaissances de
                l&apos;assistant.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="knowledge-title">Titre</Label>
                <Input
                  id="knowledge-title"
                  placeholder="Ex : Horaires d'ouverture du campus"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="knowledge-content">Contenu</Label>
                <Textarea
                  id="knowledge-content"
                  placeholder="Décrivez l'information en détail..."
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  required
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="knowledge-category">Catégorie</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm({ ...form, category: value ?? "faq" })
                  }
                >
                  <SelectTrigger id="knowledge-category" className="w-full">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList>
            {categories.map((c) => (
              <TabsTrigger key={c.value} value={c.value}>
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou contenu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              {search.trim() || filter !== "all"
                ? "Aucune entrée ne correspond à vos critères."
                : "Aucune entrée dans la base de connaissances."}
            </p>
            {!search.trim() && filter === "all" && (
              <p className="mt-1 text-xs text-muted-foreground/70">
                Commencez par ajouter une entrée avec le bouton ci-dessus.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <Card key={entry.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm leading-snug">
                    {entry.title}
                  </CardTitle>
                  <CategoryBadge category={entry.category} />
                </div>
                <CardDescription className="text-xs">
                  Ajoutée le{" "}
                  {new Date(entry.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="line-clamp-4 text-sm text-muted-foreground">
                  {entry.content}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReindex(entry.id)}
                    disabled={reindexingIds.has(entry.id)}
                  >
                    <RefreshCw
                      className={`size-3.5 ${
                        reindexingIds.has(entry.id) ? "animate-spin" : ""
                      }`}
                    />
                    {reindexingIds.has(entry.id)
                      ? "Indexation..."
                      : "Re-indexer"}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="size-3.5" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Supprimer cette entrée ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          L&apos;entrée &laquo;&nbsp;{entry.title}&nbsp;&raquo;
                          sera définitivement supprimée de la base de
                          connaissances. Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(entry.id)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Compteur */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} entrée{filtered.length > 1 ? "s" : ""} affichée
          {filtered.length > 1 ? "s" : ""}
          {filter !== "all" || search.trim()
            ? ` sur ${entries.length} au total`
            : ""}
        </p>
      )}
    </div>
  );
}
