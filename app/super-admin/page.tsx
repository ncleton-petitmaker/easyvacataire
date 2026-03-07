"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  ShieldCheck,
  Phone,
  UserPlus,
  Loader2,
  ArrowRight,
  Users,
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

  function enterEtablissement(etab: Etablissement) {
    localStorage.setItem("uniplanning_etablissement_id", etab.id);
    window.location.href = "/admin/creneaux";
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#13161C]">
            Établissements
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Gérez vos établissements et leurs administrateurs
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger
            render={
              <Button size="lg" className="bg-[#4243C4] hover:bg-[#3234A0] text-white">
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
                  <div className="flex h-8 items-center rounded-lg border border-[#E5E5E3] bg-[#F0F0EE] px-2.5 text-sm text-[#6B7280]">
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
                <Button type="submit" disabled={creating} className="bg-[#4243C4] hover:bg-[#3234A0] text-white">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-[#E5E5E3]">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : etablissements.length === 0 ? (
        <Card className="border-[#E5E5E3]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#4243C4]/10">
              <Building2 className="size-7 text-[#4243C4]" />
            </div>
            <p className="text-base font-semibold text-[#13161C]">
              Aucun établissement
            </p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Créez votre premier établissement pour commencer.
            </p>
            <Button
              className="mt-4 bg-[#4243C4] hover:bg-[#3234A0] text-white"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="size-4" />
              Nouvel établissement
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Établissement cards — grid layout */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {etablissements.map((etab) => (
            <Card
              key={etab.id}
              className="group cursor-pointer border-[#E5E5E3] transition-all duration-200 hover:border-[#4243C4]/50 hover:shadow-md hover:-translate-y-0.5"
              onClick={() => enterEtablissement(etab)}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-[#13161C]">
                      {etab.name}
                    </h3>
                    <p className="mt-0.5 font-mono text-xs text-[#6B7280]">
                      /{etab.slug}
                    </p>
                  </div>
                  <Badge
                    className={
                      etab.is_active
                        ? "bg-[#4243C4]/10 text-[#4243C4] border-0"
                        : "bg-[#F0F0EE] text-[#6B7280] border-0"
                    }
                  >
                    {etab.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {etab.intervenants_count} intervenant
                    {etab.intervenants_count !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-[#E5E5E3] text-xs text-[#6B7280] hover:border-[#4243C4]/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(etab.id);
                      }}
                    >
                      <ShieldCheck className="size-3" />
                      Admins
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-[#E5E5E3] text-xs text-[#6B7280] hover:border-[#4243C4]/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddAdminForId(etab.id);
                      }}
                    >
                      <UserPlus className="size-3" />
                    </Button>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-[#4243C4] opacity-0 transition-opacity group-hover:opacity-100">
                    Ouvrir
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </CardContent>

              {/* Expanded admin section */}
              {expandedId === etab.id && (
                <div
                  className="border-t border-[#E5E5E3] px-5 py-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="size-4 text-[#6B7280]" />
                    <h4 className="text-sm font-medium text-[#13161C]">
                      Administrateurs
                    </h4>
                  </div>

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
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#E5E5E3] py-6">
                      <ShieldCheck className="mb-2 size-6 text-[#6B7280]/50" />
                      <p className="text-sm text-[#6B7280]">
                        Aucun administrateur
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(admins[etab.id] || []).map((admin) => (
                        <div
                          key={admin.id}
                          className="flex items-center justify-between rounded-lg bg-[#F0F0EE]/50 px-3 py-2"
                        >
                          <span className="text-sm font-medium text-[#13161C]">
                            {admin.first_name} {admin.last_name}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                            <Phone className="size-3" />
                            {admin.phone}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add admin dialog */}
      <Dialog
        open={addAdminForId !== null}
        onOpenChange={(open) => !open && setAddAdminForId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un administrateur</DialogTitle>
            <DialogDescription>
              Ajoutez un administrateur à cet établissement.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              if (addAdminForId) handleAddAdmin(e, addAdminForId);
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-fname">Prénom</Label>
                <Input
                  id="admin-fname"
                  placeholder="Prénom"
                  value={adminForm.first_name}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-lname">Nom</Label>
                <Input
                  id="admin-lname"
                  placeholder="Nom de famille"
                  value={adminForm.last_name}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, last_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-phone">Téléphone</Label>
                <Input
                  id="admin-phone"
                  placeholder="+33 6 12 34 56 78"
                  value={adminForm.phone}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, phone: e.target.value })
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
              <Button type="submit" disabled={addingAdmin} className="bg-[#4243C4] hover:bg-[#3234A0] text-white">
                {addingAdmin && <Loader2 className="size-4 animate-spin" />}
                {addingAdmin ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
