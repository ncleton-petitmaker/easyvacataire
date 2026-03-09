"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Unplug, Wand2, ChevronDown, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AvailabilityCalendar,
  type Slot,
  type BusySlot,
  type ConfirmedSlot,
} from "@/components/calendar/availability-calendar";
import { useSearchParams } from "next/navigation";

type CreneauRaw = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  session_type: string;
  matieres: { name: string; code: string | null } | null;
};

type RecurringRule = {
  id: string;
  day_of_week: number | null;
  heure_debut: string;
  heure_fin: string;
  label: string | null;
};

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAY_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Tous les jours" },
  { value: -1, label: "Lun — Ven" },
  ...JOURS.map((j, i) => ({ value: i, label: j })),
];

function ruleDayLabel(day: number | null): string {
  if (day === null) return "Tous les jours";
  if (day === -1) return "Lun — Ven";
  return JOURS[day] ?? "?";
}

function ruleDaySummary(day: number | null): string {
  if (day === null) return "Tous";
  if (day === -1) return "L-V";
  return JOURS[day]?.slice(0, 3) ?? "?";
}

const TIME_OPTIONS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00",
];

export default function MesCreneauxPage() {
  const searchParams = useSearchParams();
  const [intervenantId, setIntervenantId] = useState<string | null>(null);
  const [confirmedSlots, setConfirmedSlots] = useState<ConfirmedSlot[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoLoading, setAutoLoading] = useState(false);
  const intervenantIdRef = useRef<string | null>(null);

  // Recurring rules
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleDay, setRuleDay] = useState<number | null>(2); // mercredi par défaut
  const [ruleStart, setRuleStart] = useState("13:00");
  const [ruleEnd, setRuleEnd] = useState("19:00");
  const [ruleLabel, setRuleLabel] = useState("");
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [bufferLoading, setBufferLoading] = useState(false);

  // Handle Google OAuth return
  useEffect(() => {
    const google = searchParams.get("google");
    if (google === "connected") {
      toast.success("Google Agenda connecté !");
      window.history.replaceState({}, "", "/mes/creneaux");
    } else if (google === "error") {
      toast.error("Erreur lors de la connexion à Google Agenda");
      window.history.replaceState({}, "", "/mes/creneaux");
    }
  }, [searchParams]);

  const loadBusySlots = useCallback(
    async (intervId: string) => {
      const now = new Date();
      const from = format(startOfMonth(now), "yyyy-MM-dd");
      const to = format(endOfMonth(addMonths(now, 2)), "yyyy-MM-dd");
      try {
        const res = await fetch(
          `/api/calendar/freebusy?intervenant_id=${intervId}&from=${from}&to=${to}`
        );
        const data = await res.json();
        setGoogleConnected(data.connected === true);
        if (Array.isArray(data.busy)) setBusySlots(data.busy);
      } catch {
        // silently fail
      }
    },
    []
  );

  const loadRecurringRules = useCallback(async (intervId: string) => {
    try {
      const res = await fetch(`/api/recurring-unavailability?intervenant_id=${intervId}`);
      const data = await res.json();
      if (Array.isArray(data)) setRecurringRules(data);
    } catch {
      // silently fail
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: intervenant } = await supabase
        .from("intervenants")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!intervenant) {
        setLoading(false);
        return;
      }

      setIntervenantId(intervenant.id);
      intervenantIdRef.current = intervenant.id;

      const [creneauxRes, dispoRes] = await Promise.all([
        fetch(
          `/api/creneaux?intervenant_id=${intervenant.id}&status=confirme,realise`
        ),
        fetch(`/api/disponibilites?intervenant_id=${intervenant.id}`),
      ]);

      const creneauxData = await creneauxRes.json();
      const dispoData = await dispoRes.json();

      if (Array.isArray(creneauxData)) {
        setConfirmedSlots(
          creneauxData.map((c: CreneauRaw) => ({
            id: c.id,
            date: c.date,
            heure_debut: c.heure_debut,
            heure_fin: c.heure_fin,
            session_type: c.session_type || "TD",
            matiere: c.matieres?.name || null,
            salle: c.salle,
          }))
        );
      }
      if (Array.isArray(dispoData)) {
        setSlots(
          dispoData.map(
            (d: {
              id: string;
              date: string;
              heure_debut: string;
              heure_fin: string;
            }) => ({
              id: d.id,
              date: d.date,
              heure_debut: d.heure_debut,
              heure_fin: d.heure_fin,
            })
          )
        );
      }

      await Promise.all([
        loadBusySlots(intervenant.id),
        loadRecurringRules(intervenant.id),
        fetch(`/api/intervenants/buffer?intervenant_id=${intervenant.id}`)
          .then((r) => r.json())
          .then((d) => setBufferMinutes(d.buffer_before_minutes ?? 0))
          .catch(() => {}),
      ]);
    } catch {
      toast.error("Erreur lors du chargement");
    }
    setLoading(false);
  }, [loadBusySlots, loadRecurringRules]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-sync Google Calendar + remplir créneaux libres toutes les 15 min
  const syncGoogle = useCallback(async () => {
    const id = intervenantIdRef.current;
    if (!id) return;

    // Rafraîchir les busy slots
    await loadBusySlots(id);

    // Auto-remplir les créneaux libres (silencieux)
    try {
      const now = new Date();
      const from = format(now, "yyyy-MM-dd");
      const to = format(endOfMonth(addMonths(now, 2)), "yyyy-MM-dd");
      await fetch("/api/calendar/auto-dispos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intervenant_id: id,
          from,
          to,
          heure_debut: "08:00",
          heure_fin: "19:00",
        }),
      });
    } catch {
      // silencieux
    }

    // Recharger les dispos
    try {
      const res = await fetch(`/api/disponibilites?intervenant_id=${id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSlots(
          data.map(
            (d: { id: string; date: string; heure_debut: string; heure_fin: string }) => ({
              id: d.id, date: d.date, heure_debut: d.heure_debut, heure_fin: d.heure_fin,
            })
          )
        );
      }
    } catch {
      // silencieux
    }
  }, [loadBusySlots]);

  useEffect(() => {
    const interval = setInterval(syncGoogle, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [syncGoogle]);

  async function handleAddSlot(slot: Omit<Slot, "id">) {
    if (!intervenantId) return;
    const res = await fetch("/api/disponibilites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...slot,
        intervenant_id: intervenantId,
        source: "web",
      }),
    });
    if (!res.ok) {
      toast.error("Erreur lors de l'enregistrement");
      return;
    }
    toast.success("Disponibilité enregistrée");
    load();
  }

  async function handleRemoveSlot(slotId: string) {
    const res = await fetch(`/api/disponibilites?id=${slotId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    load();
  }

  async function handleDisconnectGoogle() {
    const res = await fetch("/api/google-calendar/disconnect", {
      method: "POST",
    });
    if (res.ok) {
      setGoogleConnected(false);
      setBusySlots([]);
      toast.success("Google Agenda déconnecté — créneaux auto supprimés");
      load();
    } else {
      toast.error("Erreur lors de la déconnexion");
    }
  }

  async function handleAutoDispos() {
    if (!intervenantId) return;
    setAutoLoading(true);
    try {
      const now = new Date();
      const from = format(now, "yyyy-MM-dd");
      const to = format(endOfMonth(addMonths(now, 2)), "yyyy-MM-dd");

      const res = await fetch("/api/calendar/auto-dispos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intervenant_id: intervenantId,
          from,
          to,
          heure_debut: "08:00",
          heure_fin: "19:00",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.created > 0) {
          toast.success(`${data.created} créneaux libres ajoutés comme disponibles`);
          load();
        } else {
          toast.info("Aucun nouveau créneau libre trouvé");
        }
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la génération automatique");
    }
    setAutoLoading(false);
  }

  async function handleAddRule() {
    if (!intervenantId) return;
    const res = await fetch("/api/recurring-unavailability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intervenant_id: intervenantId,
        day_of_week: ruleDay,
        heure_debut: ruleStart,
        heure_fin: ruleEnd,
        label: ruleLabel || null,
      }),
    });
    if (res.ok) {
      toast.success("Indisponibilité récurrente ajoutée");
      setShowRuleForm(false);
      setRuleLabel("");
      loadRecurringRules(intervenantId);
    } else {
      toast.error("Erreur lors de l'ajout");
    }
  }

  async function handleDeleteRule(ruleId: string) {
    const res = await fetch(`/api/recurring-unavailability?id=${ruleId}`, {
      method: "DELETE",
    });
    if (res.ok && intervenantId) {
      loadRecurringRules(intervenantId);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-[#4243C4]" />
        <p className="mt-3 text-sm text-muted-foreground">
          Chargement du planning...
        </p>
      </div>
    );
  }

  if (!intervenantId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Impossible de charger votre profil.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mon planning</h1>
          <p className="text-sm text-muted-foreground">
            Ajoutez vos disponibilités et consultez vos créneaux confirmés.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {googleConnected ? (
            <>
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Google Agenda connecté
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleAutoDispos}
                disabled={autoLoading}
              >
                {autoLoading ? (
                  <Loader2 className="size-3 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="size-3 mr-1" />
                )}
                Remplir les créneaux libres
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={handleDisconnectGoogle}
              >
                <Unplug className="size-3 mr-1" />
                Déconnecter
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "/api/google-calendar/connect";
              }}
            >
              <svg className="size-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Connecter Google Agenda
            </Button>
          )}
        </div>
      </div>

      {/* Indisponibilités récurrentes — compact collapsible */}
      <div className="border-b border-zinc-100 pb-2">
        <button
          onClick={() => setRulesOpen(!rulesOpen)}
          className="flex w-full items-center gap-2 py-1 text-xs text-zinc-500 hover:text-zinc-700"
        >
          <ChevronDown className={`size-3.5 transition-transform ${rulesOpen ? "rotate-0" : "-rotate-90"}`} />
          Indisponibilités récurrentes
          {recurringRules.length > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              {recurringRules.length}
            </span>
          )}
          {!rulesOpen && recurringRules.length > 0 && (
            <span className="text-[10px] text-zinc-400 ml-auto">
              {recurringRules.map((r) => `${ruleDaySummary(r.day_of_week)} ${r.heure_debut.slice(0, 5)}-${r.heure_fin.slice(0, 5)}`).join(" · ")}
            </span>
          )}
        </button>

        {rulesOpen && (
          <div className="mt-2 space-y-2 pl-5">
            {recurringRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-zinc-600">
                  <span className="font-medium">{ruleDayLabel(rule.day_of_week)}</span>{" "}
                  {rule.heure_debut.slice(0, 5)} — {rule.heure_fin.slice(0, 5)}
                  {rule.label && (
                    <span className="text-zinc-400 ml-1">({rule.label})</span>
                  )}
                </span>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-red-400 hover:text-red-600 ml-2"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}

            {showRuleForm ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 space-y-2">
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  <select
                    value={ruleDay === null ? "null" : String(ruleDay)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRuleDay(v === "null" ? null : Number(v));
                    }}
                    className="rounded border border-zinc-200 px-1.5 py-1 text-xs"
                  >
                    {DAY_OPTIONS.map((o) => (
                      <option key={String(o.value)} value={o.value === null ? "null" : String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ruleStart}
                    onChange={(e) => setRuleStart(e.target.value)}
                    className="rounded border border-zinc-200 px-1.5 py-1 text-xs"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={ruleEnd}
                    onChange={(e) => setRuleEnd(e.target.value)}
                    className="rounded border border-zinc-200 px-1.5 py-1 text-xs"
                  >
                    {TIME_OPTIONS.filter((t) => t > ruleStart).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={ruleLabel}
                    onChange={(e) => setRuleLabel(e.target.value)}
                    placeholder="Motif"
                    className="rounded border border-zinc-200 px-1.5 py-1 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRule}
                    className="rounded bg-[#4243C4] px-3 py-1 text-xs font-medium text-white hover:bg-[#3234A0]"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => setShowRuleForm(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-600"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRuleForm(true)}
                className="text-xs text-[#4243C4] hover:underline"
              >
                + Ajouter une règle
              </button>
            )}

            {/* Buffer avant créneaux confirmés */}
            <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3">
              <span className="text-xs text-zinc-500 whitespace-nowrap">Temps de route avant un créneau :</span>
              <select
                value={bufferMinutes}
                onChange={async (e) => {
                  const val = Number(e.target.value);
                  setBufferMinutes(val);
                  setBufferLoading(true);
                  try {
                    await fetch("/api/intervenants/buffer", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ intervenant_id: intervenantId, buffer_before_minutes: val }),
                    });
                  } catch { /* silencieux */ }
                  setBufferLoading(false);
                }}
                className="rounded border border-zinc-200 px-1.5 py-1 text-xs"
              >
                <option value={0}>Aucun</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1h</option>
                <option value={90}>1h30</option>
                <option value={120}>2h</option>
              </select>
              {bufferLoading && <Loader2 className="size-3 animate-spin text-zinc-400" />}
            </div>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full ring-2 ring-emerald-400 bg-emerald-100" />
          Match confirmé
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Indisponible (règle)
        </span>
        {googleConnected && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Occupé (Google)
          </span>
        )}
      </div>

      {/* Calendrier */}
      <AvailabilityCalendar
        slots={slots}
        busySlots={busySlots}
        confirmedSlots={confirmedSlots}
        recurringRules={recurringRules.map((r) => ({
          day_of_week: r.day_of_week,
          heure_debut: r.heure_debut.slice(0, 5),
          heure_fin: r.heure_fin.slice(0, 5),
        }))}
        onAddSlot={handleAddSlot}
        onRemoveSlot={handleRemoveSlot}
      />
    </div>
  );
}
