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
  Euro,
  FileDown,
  GaugeCircle,
  Banknote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHeTD, getMontantBrut, PLAFOND_HETD } from "@/lib/hetd";
import { generateEtatServiceFait } from "@/lib/pdf/etat-service-fait";
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
  session_type: string;
  payment_status: string;
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
    let hetdRealisees = 0;
    let hetdConfirmees = 0;
    let montantBrut = 0;
    let montantAPayer = 0;
    let sessionsPaye = 0;
    let sessionsNonPaye = 0;
    const matiereSet = new Set<string>();

    for (const c of creneaux) {
      const h = parseHours(c.heure_debut, c.heure_fin);
      const type = c.session_type || "TD";
      if (c.matieres?.name) matiereSet.add(c.matieres.name);

      if (c.status === "realise") {
        heuresRealisees += h;
        sessionsRealisees++;
        hetdRealisees += getHeTD(type, h);
        montantBrut += getMontantBrut(type, h);
        if (c.payment_status === "paye") {
          sessionsPaye++;
        } else {
          sessionsNonPaye++;
          montantAPayer += getMontantBrut(type, h);
        }
      } else if (c.status === "non_realise") {
        sessionsNonRealisees++;
      } else if (c.status === "confirme") {
        heuresConfirmees += h;
        sessionsConfirmees++;
        hetdConfirmees += getHeTD(type, h);
        if (c.date > todayStr) sessionsAVenir++;
      }
    }

    const hetdTotal = hetdRealisees + hetdConfirmees;
    const progressPlafond = Math.min((hetdTotal / PLAFOND_HETD) * 100, 100);

    return {
      heuresRealisees,
      heuresConfirmees,
      sessionsRealisees,
      sessionsConfirmees,
      sessionsNonRealisees,
      sessionsAVenir,
      totalHeures: heuresRealisees + heuresConfirmees,
      matieres: matiereSet.size,
      hetdRealisees,
      hetdConfirmees,
      hetdTotal,
      montantBrut,
      montantAPayer,
      progressPlafond,
      sessionsPaye,
      sessionsNonPaye,
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

  async function togglePaymentStatus(creneauId: string, current: string) {
    const newStatus = current === "paye" ? "non_paye" : "paye";
    setUpdatingId(creneauId);
    try {
      const res = await fetch(`/api/creneaux/${creneauId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setCreneaux((prev) =>
        prev.map((c) => (c.id === creneauId ? { ...c, payment_status: newStatus } : c))
      );
      toast.success(newStatus === "paye" ? "Marqué comme payé" : "Marqué comme non payé");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
    setUpdatingId(null);
  }

  async function markAllAsPaid() {
    const unpaid = creneaux.filter(
      (c) => c.status === "realise" && c.payment_status !== "paye"
    );
    if (unpaid.length === 0) {
      toast.info("Toutes les sessions réalisées sont déjà payées");
      return;
    }
    try {
      await Promise.all(
        unpaid.map((c) =>
          fetch(`/api/creneaux/${c.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payment_status: "paye" }),
          })
        )
      );
      setCreneaux((prev) =>
        prev.map((c) =>
          c.status === "realise" ? { ...c, payment_status: "paye" } : c
        )
      );
      toast.success(`${unpaid.length} session(s) marquée(s) comme payée(s)`);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function handleExportPDF() {
    const realises = creneaux.filter((c) => c.status === "realise");
    if (realises.length === 0) {
      toast.warning("Aucune session réalisée à exporter");
      return;
    }
    if (!intervenant) return;
    const blob = generateEtatServiceFait({
      intervenant: {
        first_name: intervenant.first_name,
        last_name: intervenant.last_name,
        email: intervenant.email,
      },
      creneaux: realises,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `etat-service-fait_${intervenant.last_name}_${intervenant.first_name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="flex items-center justify-between">
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
        <Button variant="outline" onClick={handleExportPDF}>
          <FileDown className="size-4 mr-2" />
          Exporter état de service
        </Button>
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
              <TrendingUp className="size-4" />
              <span className="text-xs font-medium">HeTD validées</span>
            </div>
            <p className="text-2xl font-bold">{stats.hetdRealisees.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">
              + {stats.hetdConfirmees.toFixed(1)} confirmées
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Euro className="size-4" />
              <span className="text-xs font-medium">Montant brut</span>
            </div>
            <p className="text-2xl font-bold">{stats.montantBrut.toFixed(0)} €</p>
            <p className="text-xs text-muted-foreground">
              {stats.matieres} matière{stats.matieres !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-violet-600 mb-1">
              <GaugeCircle className="size-4" />
              <span className="text-xs font-medium">Plafond annuel</span>
            </div>
            <p className="text-2xl font-bold">{stats.hetdTotal.toFixed(1)}<span className="text-sm font-normal text-muted-foreground"> / {PLAFOND_HETD}</span></p>
            <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${stats.progressPlafond > 90 ? "bg-red-500" : stats.progressPlafond > 70 ? "bg-amber-500" : "bg-violet-500"}`}
                style={{ width: `${stats.progressPlafond}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <Banknote className="size-4" />
              <span className="text-xs font-medium">À payer</span>
            </div>
            <p className="text-2xl font-bold">{stats.montantAPayer.toFixed(0)} €</p>
            <p className="text-xs text-muted-foreground">
              {stats.sessionsNonPaye} session{stats.sessionsNonPaye !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Banknote className="size-4" />
              <span className="text-xs font-medium">Payées</span>
            </div>
            <p className="text-2xl font-bold">{stats.sessionsPaye}</p>
            <p className="text-xs text-muted-foreground">
              {(stats.montantBrut - stats.montantAPayer).toFixed(0)} € versés
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Sessions</CardTitle>
            {stats.sessionsNonPaye > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={markAllAsPaid}
              >
                <Banknote className="size-3 mr-1" />
                Marquer tout comme payé
              </Button>
            )}
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
                          onPaymentToggle={togglePaymentStatus}
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
                          onPaymentToggle={togglePaymentStatus}
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

const SESSION_TYPE_COLORS: Record<string, string> = {
  CM: "bg-violet-100 text-violet-700 border-violet-300",
  TD: "bg-blue-100 text-blue-700 border-blue-300",
  TP: "bg-teal-100 text-teal-700 border-teal-300",
};

function CreneauRow({
  creneau,
  updating,
  onStatusChange,
  onPaymentToggle,
  isPast,
}: {
  creneau: Creneau;
  updating: boolean;
  onStatusChange: (id: string, status: "realise" | "non_realise" | "confirme") => void;
  onPaymentToggle: (id: string, current: string) => void;
  isPast: boolean;
}) {
  const hours = parseHours(creneau.heure_debut, creneau.heure_fin);
  const type = creneau.session_type || "TD";
  const hetd = getHeTD(type, hours);
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
          <Badge variant="outline" className={`text-[10px] font-semibold ${SESSION_TYPE_COLORS[type] || SESSION_TYPE_COLORS.TD}`}>
            {type}
          </Badge>
          <span className="text-sm font-medium">{dateLabel}</span>
          <Badge variant="outline" className="text-[10px]">
            {creneau.heure_debut.slice(0, 5)}-{creneau.heure_fin.slice(0, 5)}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {hours.toFixed(1)}h | {hetd.toFixed(1)} HeTD
          </Badge>
          {creneau.status === "realise" && (
            <Badge
              variant="outline"
              className={`text-[10px] ${creneau.payment_status === "paye" ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-orange-100 text-orange-700 border-orange-300"}`}
            >
              {creneau.payment_status === "paye" ? "Payé" : "Non payé"}
            </Badge>
          )}
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
        {creneau.status === "realise" && !updating && (
          <Button
            size="sm"
            variant="ghost"
            className={`h-7 text-xs ${creneau.payment_status === "paye" ? "text-emerald-600" : "text-orange-600"}`}
            onClick={() => onPaymentToggle(creneau.id, creneau.payment_status)}
            title={creneau.payment_status === "paye" ? "Marqué payé — cliquer pour annuler" : "Marquer comme payé"}
          >
            <Euro className="size-3" />
          </Button>
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
