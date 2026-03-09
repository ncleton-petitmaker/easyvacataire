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

  // Récupérer les règles récurrentes + buffer + créneaux confirmés
  const supabase = getServiceClient();
  const [{ data: recurringRules }, { data: bufferData }, { data: confirmedCreneaux }] = await Promise.all([
    supabase
      .from("recurring_unavailability")
      .select("*")
      .eq("intervenant_id", intervenant_id),
    supabase
      .from("intervenants")
      .select("buffer_before_minutes")
      .eq("id", intervenant_id)
      .single(),
    supabase
      .from("creneaux")
      .select("date, heure_debut, heure_fin")
      .eq("intervenant_id", intervenant_id)
      .in("status", ["confirme", "realise"])
      .gte("date", from)
      .lte("date", to),
  ]);

  const bufferMinutes = bufferData?.buffer_before_minutes ?? 0;

  // Supprimer les anciennes auto-dispos pour recalculer avec les règles/buffer actuels
  await supabase
    .from("disponibilites_intervenant")
    .delete()
    .eq("intervenant_id", intervenant_id)
    .eq("source", "google_auto")
    .gte("date", from)
    .lte("date", to);

  // Récupérer les dispos manuelles existantes pour ne pas créer de doublons
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

    // Skip si passé
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (current < today) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Vérifier les règles récurrentes pour ce jour
    // null = tous les jours, -1 = jours de semaine (lun-ven, dayOfWeek 0-4), 0-6 = jour spécifique
    const dayRules = (recurringRules || []).filter(
      (r: { day_of_week: number | null }) =>
        r.day_of_week === null ||
        r.day_of_week === dayOfWeek ||
        (r.day_of_week === -1 && dayOfWeek >= 0 && dayOfWeek <= 4)
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

    // Soustraire le buffer avant les créneaux confirmés (temps de route)
    if (bufferMinutes > 0) {
      const dayConfirmed = (confirmedCreneaux || []).filter(
        (c: { date: string }) => c.date === dateStr
      );
      for (const c of dayConfirmed) {
        const cStart = (c as { heure_debut: string }).heure_debut.slice(0, 5);
        const cStartMin = parseInt(cStart.split(":")[0]) * 60 + parseInt(cStart.split(":")[1]);
        const bufferStartMin = Math.max(0, cStartMin - bufferMinutes);
        const bufferStartH = `${String(Math.floor(bufferStartMin / 60)).padStart(2, "0")}:${String(bufferStartMin % 60).padStart(2, "0")}`;
        freeSlots = subtractRange(freeSlots, bufferStartH, cStart);
      }
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
