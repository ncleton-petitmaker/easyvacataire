"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Plus,
  Upload,
  Trash2,
  Search,
  Users,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Intervenant = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  specialite: string | null;
  role: string;
};

const emptyForm = {
  first_name: "",
  last_name: "",
  phone: "+33",
  email: "",
  specialite: "",
  role: "intervenant",
};

export default function IntervenantsPage() {
  const [etablissementId] = useEtablissementId();
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    if (!etablissementId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/intervenants?etablissement_id=${etablissementId}`
      );
      const data = await res.json();
      if (Array.isArray(data)) setIntervenants(data);
    } catch {
      toast.error("Erreur lors du chargement des intervenants.");
    } finally {
      setLoading(false);
    }
  }, [etablissementId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredIntervenants = useMemo(() => {
    if (!searchQuery.trim()) return intervenants;
    const q = searchQuery.toLowerCase();
    return intervenants.filter(
      (i) =>
        i.first_name.toLowerCase().includes(q) ||
        i.last_name.toLowerCase().includes(q) ||
        i.phone.includes(q) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        (i.specialite && i.specialite.toLowerCase().includes(q))
    );
  }, [intervenants, searchQuery]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!etablissementId) return;
    try {
      const res = await fetch("/api/intervenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, etablissement_id: etablissementId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Intervenant ajouté avec succès.");
      setForm({ ...emptyForm });
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Erreur lors de l'ajout de l'intervenant.");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/intervenants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Intervenant désactivé avec succès.");
      load();
    } catch {
      toast.error("Erreur lors de la désactivation de l'intervenant.");
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
      formData.append("type", "intervenants");
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const result = await res.json();
      if (result.errors?.length) {
        toast.warning(
          `${result.imported} intervenants importés avec ${result.errors.length} erreur(s).`
        );
      } else {
        toast.success(`${result.imported} intervenants importés avec succès.`);
      }
      load();
    } catch {
      toast.error("Erreur lors de l'import du fichier CSV.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!etablissementId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="mb-4 size-12 text-muted-foreground/50" />
          <p>Aucun établissement sélectionné.</p>
          <p className="text-sm">
            Configurez-le dans les paramètres.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vacataires</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les vacataires de votre établissement.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload data-icon="inline-start" />
            {importing ? "Import en cours..." : "Importer CSV"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={<Button />}
              onClick={() => {
                setForm({ ...emptyForm });
                setDialogOpen(true);
              }}
            >
              <Plus data-icon="inline-start" />
              Ajouter
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un intervenant</DialogTitle>
                <DialogDescription>
                  Remplissez les informations de l&apos;intervenant.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} id="add-intervenant-form">
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Prénom</Label>
                      <Input
                        id="first_name"
                        placeholder="Prénom"
                        value={form.first_name}
                        onChange={(e) =>
                          setForm({ ...form, first_name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nom</Label>
                      <Input
                        id="last_name"
                        placeholder="Nom"
                        value={form.last_name}
                        onChange={(e) =>
                          setForm({ ...form, last_name: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      placeholder="+33 6 12 34 56 78"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optionnel)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemple.fr"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialite">Spécialité (optionnel)</Label>
                    <Input
                      id="specialite"
                      placeholder="ex: Mathématiques, Informatique..."
                      value={form.specialite}
                      onChange={(e) =>
                        setForm({ ...form, specialite: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rôle</Label>
                    <Select
                      value={form.role}
                      onValueChange={(val) =>
                        setForm({ ...form, role: val as string })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intervenant">Intervenant</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </form>

              <DialogFooter>
                <Button
                  type="submit"
                  form="add-intervenant-form"
                >
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des intervenants</CardTitle>
              <CardDescription>
                {intervenants.length} intervenant{intervenants.length !== 1 ? "s" : ""} enregistré{intervenants.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un intervenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredIntervenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="mb-4 size-12 text-muted-foreground/30" />
              {searchQuery ? (
                <>
                  <p className="font-medium">Aucun résultat</p>
                  <p className="text-sm">
                    Aucun intervenant ne correspond à &laquo;&nbsp;{searchQuery}&nbsp;&raquo;.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Aucun intervenant</p>
                  <p className="text-sm">
                    Ajoutez votre premier intervenant pour commencer.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIntervenants.map((i) => (
                  <TableRow
                    key={i.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/intervenants/${i.id}`)}
                  >
                    <TableCell className="font-medium">
                      {i.first_name} {i.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {i.phone}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {i.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {i.specialite || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={i.role === "admin" ? "default" : "secondary"}
                      >
                        {i.role === "admin" ? "Admin" : "Intervenant"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              />
                            }
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Désactiver cet intervenant ?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                L&apos;intervenant {i.first_name} {i.last_name} sera
                                désactivé. Cette action peut être annulée par un
                                administrateur.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(i.id)}
                              >
                                Désactiver
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
