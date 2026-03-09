import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/google-calendar";
import { getServiceClient } from "@/lib/supabase/server";

// Génère des créneaux de disponibilité à partir des plages libres Google Calendar
export async function POST(req: NextRequest) {
  const { intervenant_id, from, to, heure_debut, heure_fin } = await req.json();

  if (!intervenant_id || !from || !to) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const startH = heure_debut || "08:00";
  const endH = heure_fin || "19:00";

  const accessToken = await getValidAccessToken(intervenant_id);
  if (!accessToken) {
    return NextResponse.json({ error: "Google non connecté" }, { status: 400 });
  }

  // Récupérer les busy slots
  const timeMin = new Date(`${from}T00:00:00+01:00`).toISOString();
  const timeMax = new Date(`${to}T23:59:59+01:00`).toISOString();

  const gRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: "Europe/Paris",
      items: [{ id: "primary" }],
    }),
  });

  if (!gRes.ok) {
    return NextResponse.json({ error: "Erreur Google Calendar" }, { status: 500 });
  }

  const gData = await gRes.json();
  const busySlots: { start: string; end: string }[] =
    gData.calendars?.primary?.busy || [];

  // Récupérer les règles récurrentes
  const supabase = getServiceClient();
  const { data: recurringRules } = await supabase
    .from("recurring_unavailability")
    .select("*")
    .eq("intervenant_id", intervenant_id);

  // Récupérer les dispos existantes pour ne pas créer de doublons
  const { data: existingDispos } = await supabase
    .from("disponibilites_intervenant")
    .select("date, heure_debut, heure_fin")
    .eq("intervenant_id", intervenant_id)
    .gte("date", from)
    .lte("date", to);

  const existingSet = new Set(
    (existingDispos || []).map((d) => `${d.date}|${d.heure_debut}|${d.heure_fin}`)
  );

  // Indexer les busy par date
  const busyByDate = new Map<string, { start: string; end: string }[]>();
  for (const b of busySlots) {
    const d = new Date(b.start).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
    if (!busyByDate.has(d)) busyByDate.set(d, []);
    busyByDate.get(d)!.push(b);
  }

  const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const newDispos: { intervenant_id: string; date: string; heure_debut: string; heure_fin: string; source: string }[] = [];

  // Parcourir chaque jour de la période
  const current = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);

  while (current <= end) {
    const dateStr = current.toLocaleDateString("sv-SE");
    // day_of_week: 0=lundi (date-fns convention)
    const jsDay = current.getDay(); // 0=dimanche
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // 0=lundi

    // Skip weekends (samedi=5, dimanche=6) par défaut
    if (dayOfWeek >= 5) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Skip si passé
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (current < today) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Vérifier les règles récurrentes pour ce jour
    const dayRules = (recurringRules || []).filter(
      (r: { day_of_week: number }) => r.day_of_week === dayOfWeek
    );

    // Construire les plages libres pour ce jour
    // Commencer avec la plage complète [startH, endH]
    let freeSlots = [{ start: startH, end: endH }];

    // Soustraire les busy Google
    const dayBusy = busyByDate.get(dateStr) || [];
    for (const b of dayBusy) {
      const bStart = new Date(b.start).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      });
      const bEnd = new Date(b.end).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      });
      freeSlots = subtractRange(freeSlots, bStart, bEnd);
    }

    // Soustraire les indisponibilités récurrentes
    for (const rule of dayRules) {
      const rStart = (rule as { heure_debut: string }).heure_debut.slice(0, 5);
      const rEnd = (rule as { heure_fin: string }).heure_fin.slice(0, 5);
      freeSlots = subtractRange(freeSlots, rStart, rEnd);
    }

    // Créer les dispos pour les plages libres >= 1h
    for (const slot of freeSlots) {
      if (slot.start >= slot.end) continue;
      // Minimum 1h
      const startMin = parseInt(slot.start.split(":")[0]) * 60 + parseInt(slot.start.split(":")[1]);
      const endMin = parseInt(slot.end.split(":")[0]) * 60 + parseInt(slot.end.split(":")[1]);
      if (endMin - startMin < 60) continue;

      const key = `${dateStr}|${slot.start}|${slot.end}`;
      if (!existingSet.has(key)) {
        newDispos.push({
          intervenant_id,
          date: dateStr,
          heure_debut: slot.start,
          heure_fin: slot.end,
          source: "google_auto",
        });
        existingSet.add(key);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  if (newDispos.length === 0) {
    return NextResponse.json({ created: 0, message: "Aucun créneau libre trouvé" });
  }

  const { error } = await supabase
    .from("disponibilites_intervenant")
    .insert(newDispos);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ created: newDispos.length });
}

// Soustrait une plage [removeStart, removeEnd] d'une liste de plages libres
function subtractRange(
  slots: { start: string; end: string }[],
  removeStart: string,
  removeEnd: string
): { start: string; end: string }[] {
  const result: { start: string; end: string }[] = [];
  for (const slot of slots) {
    if (removeEnd <= slot.start || removeStart >= slot.end) {
      // Pas de chevauchement
      result.push(slot);
    } else {
      // Partie avant
      if (slot.start < removeStart) {
        result.push({ start: slot.start, end: removeStart });
      }
      // Partie après
      if (slot.end > removeEnd) {
        result.push({ start: removeEnd, end: slot.end });
      }
    }
  }
  return result;
}
