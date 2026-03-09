"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Save,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  BookOpen,
  TrendingUp,
  Loader2,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Intervenant = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  specialite: string | null;
  role: string;
};

type Creneau = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  status: string;
  intervenants: { id: string; first_name: string; last_name: string } | null;
  matieres: { id: string; name: string; code: string | null } | null;
};

function parseHours(debut: string, fin: string): number {
  const [dh, dm] = debut.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);
  return (fh * 60 + fm - (dh * 60 + dm)) / 60;
}

export default function IntervenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [etablissementId] = useEtablissementId();

  const [intervenant, setIntervenant] = useState<Intervenant | null>(null);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Edit form
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    specialite: "",
    role: "intervenant",
  });

  const load = useCallback(async () => {
    if (!etablissementId) return;
    setLoading(true);
    try {
      const [intRes, crRes] = await Promise.all([
        fetch(`/api/intervenants?etablissement_id=${etablissementId}`),
        fetch(
          `/api/creneaux?etablissement_id=${etablissementId}&intervenant_id=${id}&status=confirme,realise,non_realise`
        ),
      ]);
      const intervenants = await intRes.json();
      const creneauxData = await crRes.json();

      const found = Array.isArray(intervenants)
        ? intervenants.find((i: Intervenant) => i.id === id)
        : null;

      if (found) {
        setIntervenant(found);
        setForm({
          first_name: found.first_name,
          last_name: found.last_name,
          phone: found.phone,
          email: found.email || "",
          specialite: found.specialite || "",
          role: found.role,
        });
      }
      if (Array.isArray(creneauxData)) setCreneaux(creneauxData);
    } catch {
      toast.error("Erreur lors du chargement");
    }
    setLoading(false);
  }, [etablissementId, id]);

  useEffect(() => {
    load();
  }, [load]);

  // Analytics
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");

    let heuresRealisees = 0;
    let heuresConfirmees = 0;
    let sessionsRealisees = 0;
    let sessionsConfirmees = 0;
    let sessionsNonRealisees = 0;
    let sessionsAVenir = 0;
    const matiereSet = new Set<string>();

    for (const c of creneaux) {
      const h = parseHours(c.heure_debut, c.heure_fin);
      if (c.matieres?.name) matiereSet.add(c.matieres.name);

      if (c.status === "realise") {
        heuresRealisees += h;
        sessionsRealisees++;
      } else if (c.status === "non_realise") {
        sessionsNonRealisees++;
      } else if (c.status === "confirme") {
        heuresConfirmees += h;
        sessionsConfirmees++;
        if (c.date > todayStr) sessionsAVenir++;
      }
    }

    return {
      heuresRealisees,
      heuresConfirmees,
      sessionsRealisees,
      sessionsConfirmees,
      sessionsNonRealisees,
      sessionsAVenir,
      totalHeures: heuresRealisees + heuresConfirmees,
      matieres: matiereSet.size,
    };
  }, [creneaux]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/intervenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          email: form.email || null,
          specialite: form.specialite || null,
          role: form.role,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Fiche mise à jour");
      load();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
    setSaving(false);
  }

  async function updateCreneauStatus(
    creneauId: string,
    status: "realise" | "non_realise" | "confirme"
  ) {
    setUpdatingId(creneauId);
    try {
      const res = await fetch(`/api/creneaux/${creneauId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setCreneaux((prev) =>
        prev.map((c) => (c.id === creneauId ? { ...c, status } : c))
      );
      toast.success(
        status === "realise"
          ? "Session validée"
          : status === "non_realise"
            ? "Session marquée non réalisée"
            : "Session remise en attente"
      );
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
    setUpdatingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!intervenant) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/admin/intervenants")}>
          <ArrowLeft className="size-4 mr-2" />
          Retour
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Intervenant introuvable.
          </CardContent>
        </Card>
      </div>
    );
  }

  const pastCreneaux = creneaux
    .filter((c) => c.date <= format(new Date(), "yyyy-MM-dd"))
    .sort((a, b) => b.date.localeCompare(a.date));
  const futureCreneaux = creneaux
    .filter((c) => c.date > format(new Date(), "yyyy-MM-dd"))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/intervenants")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {intervenant.first_name} {intervenant.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Fiche vacataire &middot; {intervenant.specialite || "Pas de spécialité"}
          </p>
        </div>
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CheckCircle2 className="size-4" />
              <span className="text-xs font-medium">Réalisées</span>
            </div>
            <p className="text-2xl font-bold">{stats.sessionsRealisees}</p>
            <p className="text-xs text-muted-foreground">
              {stats.heuresRealisees.toFixed(1)}h validées
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Clock className="size-4" />
              <span className="text-xs font-medium">Confirmées</span>
            </div>
            <p className="text-2xl font-bold">{stats.sessionsConfirmees}</p>
            <p className="text-xs text-muted-foreground">
              {stats.heuresConfirmees.toFixed(1)}h planifiées
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <TrendingUp className="size-4" />
              <span className="text-xs font-medium">Total heures</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalHeures.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">
              {stats.matieres} matière{stats.matieres !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <XCircle className="size-4" />
              <span className="text-xs font-medium">Non réalisées</span>
            </div>
            <p className="text-2xl font-bold">{stats.sessionsNonRealisees}</p>
            <p className="text-xs text-muted-foreground">
              {stats.sessionsAVenir} à venir
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prénom</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nom</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemple.fr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Spécialité</Label>
              <Input
                value={form.specialite}
                onChange={(e) =>
                  setForm({ ...form, specialite: e.target.value })
                }
                placeholder="ex: Informatique"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rôle</Label>
              <Select
                value={form.role}
                onValueChange={(val) => setForm({ ...form, role: val ?? "intervenant" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intervenant">Intervenant</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        {/* Sessions list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {creneaux.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <CalendarDays className="size-10 mb-2 opacity-30" />
                <p className="text-sm">Aucune session assignée</p>
              </div>
            ) : (
              <>
                {/* Past sessions - need validation */}
                {pastCreneaux.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <AlertCircle className="size-3.5" />
                      Sessions passées ({pastCreneaux.length})
                    </h3>
                    <div className="space-y-2">
                      {pastCreneaux.map((c) => (
                        <CreneauRow
                          key={c.id}
                          creneau={c}
                          updating={updatingId === c.id}
                          onStatusChange={updateCreneauStatus}
                          isPast
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Future sessions */}
                {futureCreneaux.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <CalendarDays className="size-3.5" />
                      Sessions à venir ({futureCreneaux.length})
                    </h3>
                    <div className="space-y-2">
                      {futureCreneaux.map((c) => (
                        <CreneauRow
                          key={c.id}
                          creneau={c}
                          updating={updatingId === c.id}
                          onStatusChange={updateCreneauStatus}
                          isPast={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CreneauRow({
  creneau,
  updating,
  onStatusChange,
  isPast,
}: {
  creneau: Creneau;
  updating: boolean;
  onStatusChange: (id: string, status: "realise" | "non_realise" | "confirme") => void;
  isPast: boolean;
}) {
  const hours = parseHours(creneau.heure_debut, creneau.heure_fin);
  const dateLabel = format(
    new Date(creneau.date + "T00:00:00"),
    "EEE d MMM",
    { locale: fr }
  );

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    confirme: { label: "Confirmé", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    realise: { label: "Réalisé", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    non_realise: { label: "Non réalisé", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  };
  const sc = statusConfig[creneau.status] || statusConfig.confirme;

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${sc.bg}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{dateLabel}</span>
          <Badge variant="outline" className="text-[10px]">
            {creneau.heure_debut.slice(0, 5)}-{creneau.heure_fin.slice(0, 5)}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {hours.toFixed(1)}h
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {creneau.matieres && (
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              {creneau.matieres.code || creneau.matieres.name}
            </span>
          )}
          {creneau.salle && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {creneau.salle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {updating ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : isPast && creneau.status === "confirme" ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              onClick={() => onStatusChange(creneau.id, "realise")}
            >
              <CheckCircle2 className="size-3 mr-1" />
              Valider
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => onStatusChange(creneau.id, "non_realise")}
            >
              <XCircle className="size-3 mr-1" />
              Non réalisé
            </Button>
          </>
        ) : (
          <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
        )}
        {creneau.status !== "confirme" && isPast && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => onStatusChange(creneau.id, "confirme")}
          >
            Annuler
          </Button>
        )}
      </div>
    </div>
  );
}
