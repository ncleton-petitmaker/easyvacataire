"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  ChevronDown,
  Plus,
  ShieldCheck,
  Phone,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type Etablissement = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  intervenants_count: number;
};

type Admin = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
};

export default function SuperAdminPage() {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Track expanded établissements and their admins
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Record<string, Admin[]>>({});
  const [loadingAdmins, setLoadingAdmins] = useState<string | null>(null);

  // Add admin dialog state
  const [addAdminForId, setAddAdminForId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({
    phone: "+33",
    first_name: "",
    last_name: "",
  });
  const [addingAdmin, setAddingAdmin] = useState(false);

  const loadEtablissements = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/etablissements");
    const data = await res.json();
    if (Array.isArray(data)) setEtablissements(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEtablissements();
  }, [loadEtablissements]);

  async function loadAdmins(etablissementId: string) {
    setLoadingAdmins(etablissementId);
    const res = await fetch(`/api/etablissements/${etablissementId}/admins`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setAdmins((prev) => ({ ...prev, [etablissementId]: data }));
    }
    setLoadingAdmins(null);
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!admins[id]) {
        loadAdmins(id);
      }
    }
  }

  function generateSlug(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/etablissements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName }),
    });
    if (res.ok) {
      setCreateName("");
      setShowCreateDialog(false);
      loadEtablissements();
    } else {
      const data = await res.json();
      setCreateError(data.error || "Erreur lors de la création");
    }
    setCreating(false);
  }

  async function handleAddAdmin(e: React.FormEvent, etablissementId: string) {
    e.preventDefault();
    setAddingAdmin(true);
    const res = await fetch("/api/intervenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...adminForm,
        role: "admin",
        etablissement_id: etablissementId,
      }),
    });
    if (res.ok) {
      setAdminForm({ phone: "+33", first_name: "", last_name: "" });
      setAddAdminForId(null);
      loadAdmins(etablissementId);
      loadEtablissements();
    }
    setAddingAdmin(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Établissements
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos établissements et leurs administrateurs
          </p>
        </div>

        {/* Dialog : créer un établissement */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger
            render={
              <Button size="lg">
                <Plus className="size-4" />
                Nouvel établissement
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un établissement</DialogTitle>
              <DialogDescription>
                Renseignez le nom du nouvel établissement. Le slug sera généré
                automatiquement.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="etab-name">Nom</Label>
                  <Input
                    id="etab-name"
                    placeholder="Nom de l'établissement"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (auto-généré)</Label>
                  <div className="flex h-8 items-center rounded-lg border border-input bg-muted/50 px-2.5 text-sm text-muted-foreground">
                    {generateSlug(createName) || "—"}
                  </div>
                </div>
                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="size-4 animate-spin" />}
                  {creating ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : etablissements.length === 0 ? (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <Building2 className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Aucun établissement</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez votre premier établissement pour commencer.
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="size-4" />
              Nouvel établissement
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Établissement cards */
        <div className="space-y-3">
          {etablissements.map((etab) => (
            <Card key={etab.id}>
              {/* Établissement header */}
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleExpand(etab.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle>{etab.name}</CardTitle>
                    <CardDescription>
                      /{etab.slug} &middot; {etab.intervenants_count}{" "}
                      intervenant{etab.intervenants_count !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                </div>
                <CardAction>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={etab.is_active ? "default" : "secondary"}
                    >
                      {etab.is_active ? "Actif" : "Inactif"}
                    </Badge>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform ${
                        expandedId === etab.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CardAction>
              </CardHeader>

              {/* Expanded admin section */}
              {expandedId === etab.id && (
                <>
                  <Separator />
                  <CardContent>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">
                          Administrateurs
                        </h4>
                      </div>

                      {/* Dialog : ajouter un admin */}
                      <Dialog
                        open={addAdminForId === etab.id}
                        onOpenChange={(open) =>
                          setAddAdminForId(open ? etab.id : null)
                        }
                      >
                        <DialogTrigger
                          render={
                            <Button variant="outline" size="sm">
                              <UserPlus className="size-3.5" />
                              Ajouter un admin
                            </Button>
                          }
                        />
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              Ajouter un administrateur
                            </DialogTitle>
                            <DialogDescription>
                              Ajoutez un administrateur à{" "}
                              <strong>{etab.name}</strong>.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => handleAddAdmin(e, etab.id)}
                          >
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor={`fname-${etab.id}`}>
                                  Prénom
                                </Label>
                                <Input
                                  id={`fname-${etab.id}`}
                                  placeholder="Prénom"
                                  value={adminForm.first_name}
                                  onChange={(e) =>
                                    setAdminForm({
                                      ...adminForm,
                                      first_name: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`lname-${etab.id}`}>
                                  Nom
                                </Label>
                                <Input
                                  id={`lname-${etab.id}`}
                                  placeholder="Nom de famille"
                                  value={adminForm.last_name}
                                  onChange={(e) =>
                                    setAdminForm({
                                      ...adminForm,
                                      last_name: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`phone-${etab.id}`}>
                                  Téléphone
                                </Label>
                                <Input
                                  id={`phone-${etab.id}`}
                                  placeholder="+33 6 12 34 56 78"
                                  value={adminForm.phone}
                                  onChange={(e) =>
                                    setAdminForm({
                                      ...adminForm,
                                      phone: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter className="mt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAddAdminForId(null)}
                              >
                                Annuler
                              </Button>
                              <Button type="submit" disabled={addingAdmin}>
                                {addingAdmin && (
                                  <Loader2 className="size-4 animate-spin" />
                                )}
                                {addingAdmin ? "Ajout..." : "Ajouter"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Admin table */}
                    {loadingAdmins === etab.id ? (
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="flex items-center gap-3 py-2">
                            <Skeleton className="size-8 rounded-full" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-3.5 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (admins[etab.id] || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
                        <ShieldCheck className="mb-2 size-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          Aucun administrateur
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                          Ajoutez un premier admin pour cet établissement.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Prénom</TableHead>
                            <TableHead>Téléphone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(admins[etab.id] || []).map((admin) => (
                            <TableRow key={admin.id}>
                              <TableCell className="font-medium">
                                {admin.last_name}
                              </TableCell>
                              <TableCell>{admin.first_name}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                  <Phone className="size-3" />
                                  {admin.phone}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
