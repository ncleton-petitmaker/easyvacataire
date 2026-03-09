"use client";

import { useState, useEffect, useMemo } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Euro,
  GaugeCircle,
  Banknote,
  Loader2,
  BookOpen,
  MapPin,
  FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHeTD, getMontantBrut, PLAFOND_HETD } from "@/lib/hetd";
import { generateEtatServiceFait } from "@/lib/pdf/etat-service-fait";

type Creneau = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  status: string;
  session_type: string;
  payment_status: string;
  matieres: { name: string; code: string | null } | null;
};

type Intervenant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
};

function parseHours(debut: string, fin: string): number {
  const [dh, dm] = debut.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);
  return (fh * 60 + fm - (dh * 60 + dm)) / 60;
}

const SESSION_TYPE_COLORS: Record<string, string> = {
  CM: "bg-violet-100 text-violet-700 border-violet-300",
  TD: "bg-blue-100 text-blue-700 border-blue-300",
  TP: "bg-teal-100 text-teal-700 border-teal-300",
};

export default function VacataireSuiviPage() {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [intervenant, setIntervenant] = useState<Intervenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: interv } = await supabase
          .from("intervenants")
          .select("id, first_name, last_name, email")
          .eq("user_id", user.id)
          .single();

        if (!interv) {
          setLoading(false);
          return;
        }

        setIntervenant(interv);

        const res = await fetch(
          `/api/creneaux?intervenant_id=${interv.id}&status=confirme,realise,non_realise`
        );
        const data = await res.json();
        if (Array.isArray(data)) setCreneaux(data);
      } catch {
        toast.error("Erreur lors du chargement");
      }
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    let heuresRealisees = 0;
    let heuresConfirmees = 0;
    let sessionsRealisees = 0;
    let sessionsConfirmees = 0;
    let hetdRealisees = 0;
    let hetdConfirmees = 0;
    let montantBrut = 0;
    let montantPaye = 0;
    let montantNonPaye = 0;
    let sessionsPaye = 0;
    let sessionsNonPaye = 0;

    for (const c of creneaux) {
      const h = parseHours(c.heure_debut, c.heure_fin);
      const type = c.session_type || "TD";

      if (c.status === "realise") {
        heuresRealisees += h;
        sessionsRealisees++;
        hetdRealisees += getHeTD(type, h);
        const m = getMontantBrut(type, h);
        montantBrut += m;
        if (c.payment_status === "paye") {
          sessionsPaye++;
          montantPaye += m;
        } else {
          sessionsNonPaye++;
          montantNonPaye += m;
        }
      } else if (c.status === "confirme") {
        heuresConfirmees += h;
        sessionsConfirmees++;
        hetdConfirmees += getHeTD(type, h);
      }
    }

    const hetdTotal = hetdRealisees + hetdConfirmees;
    const progressPlafond = Math.min((hetdTotal / PLAFOND_HETD) * 100, 100);

    return {
      heuresRealisees,
      heuresConfirmees,
      sessionsRealisees,
      sessionsConfirmees,
      hetdRealisees,
      hetdConfirmees,
      hetdTotal,
      montantBrut,
      montantPaye,
      montantNonPaye,
      progressPlafond,
      sessionsPaye,
      sessionsNonPaye,
    };
  }, [creneaux]);

  function handleExportPDF() {
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
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-[#4243C4]" />
        <p className="mt-3 text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!intervenant) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Impossible de charger votre profil.
        </CardContent>
      </Card>
    );
  }

  const realises = creneaux
    .filter((c) => c.status === "realise")
    .sort((a, b) => b.date.localeCompare(a.date));
  const confirmes = creneaux
    .filter((c) => c.status === "confirme")
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suivi des heures</h1>
          <p className="text-sm text-muted-foreground">
            Récapitulatif de vos heures et paiements
          </p>
        </div>
        <Button variant="outline" onClick={handleExportPDF}>
          <FileDown className="size-4 mr-2" />
          Exporter PDF
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
              sessions réalisées
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-violet-600 mb-1">
              <GaugeCircle className="size-4" />
              <span className="text-xs font-medium">Plafond annuel</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.hetdTotal.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground"> / {PLAFOND_HETD}</span>
            </p>
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
              <Clock className="size-4" />
              <span className="text-xs font-medium">En attente de paiement</span>
            </div>
            <p className="text-2xl font-bold">{stats.montantNonPaye.toFixed(0)} €</p>
            <p className="text-xs text-muted-foreground">
              {stats.sessionsNonPaye} session{stats.sessionsNonPaye !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Banknote className="size-4" />
              <span className="text-xs font-medium">Payé</span>
            </div>
            <p className="text-2xl font-bold">{stats.montantPaye.toFixed(0)} €</p>
            <p className="text-xs text-muted-foreground">
              {stats.sessionsPaye} session{stats.sessionsPaye !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions list */}
      <div className="grid grid-cols-1 gap-6">
        {/* Réalisées */}
        {realises.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessions réalisées ({realises.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {realises.map((c) => (
                <CreneauRow key={c.id} creneau={c} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Confirmées / à venir */}
        {confirmes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessions confirmées ({confirmes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {confirmes.map((c) => (
                <CreneauRow key={c.id} creneau={c} />
              ))}
            </CardContent>
          </Card>
        )}

        {creneaux.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucune session pour le moment.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CreneauRow({ creneau }: { creneau: Creneau }) {
  const hours = parseHours(creneau.heure_debut, creneau.heure_fin);
  const type = creneau.session_type || "TD";
  const hetd = getHeTD(type, hours);
  const montant = getMontantBrut(type, hours);
  const dateLabel = format(
    new Date(creneau.date + "T00:00:00"),
    "EEE d MMM yyyy",
    { locale: fr }
  );

  const statusBg =
    creneau.status === "realise"
      ? "bg-emerald-50 border-emerald-200"
      : "bg-blue-50 border-blue-200";

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${statusBg}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold ${SESSION_TYPE_COLORS[type] || SESSION_TYPE_COLORS.TD}`}
          >
            {type}
          </Badge>
          <span className="text-sm font-medium">{dateLabel}</span>
          <Badge variant="outline" className="text-[10px]">
            {creneau.heure_debut.slice(0, 5)}-{creneau.heure_fin.slice(0, 5)}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {hours.toFixed(1)}h | {hetd.toFixed(1)} HeTD | {montant.toFixed(0)} €
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

      <div className="shrink-0">
        {creneau.status === "realise" && (
          <Badge
            variant="outline"
            className={`text-[10px] ${creneau.payment_status === "paye" ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-orange-100 text-orange-700 border-orange-300"}`}
          >
            {creneau.payment_status === "paye" ? "Payé" : "Non payé"}
          </Badge>
        )}
        {creneau.status === "confirme" && (
          <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-700 border-blue-300">
            Confirmé
          </Badge>
        )}
      </div>
    </div>
  );
}
