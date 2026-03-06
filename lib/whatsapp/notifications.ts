/**
 * WhatsApp notification helpers for schedule changes and reminders.
 */

import { getServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppText } from "./evolution";

interface CreneauInfo {
  date: string;
  heure_debut: string;
  heure_fin: string;
  salle?: string | null;
  matiere?: string;
  intervenant_phone?: string;
  intervenant_name?: string;
}

/**
 * Notify an intervenant of a schedule change (room change, time change, cancellation).
 */
export async function notifyScheduleChange(
  creneauId: string,
  changeType: "room_change" | "time_change" | "cancelled" | "confirmed"
) {
  const supabase = getServiceClient();

  const { data: creneau } = await supabase
    .from("creneaux")
    .select(
      "date, heure_debut, heure_fin, salle, matieres(name), intervenants(phone, first_name)"
    )
    .eq("id", creneauId)
    .single();

  if (!creneau) return;

  const intervenant = (creneau as Record<string, unknown>).intervenants as Record<string, string> | null;
  const matiere = (creneau as Record<string, unknown>).matieres as Record<string, string> | null;

  if (!intervenant?.phone) return;

  const matiereName = matiere?.name || "Cours";
  const prenom = intervenant.first_name || "";

  let message: string;

  switch (changeType) {
    case "room_change":
      message = [
        `Bonjour${prenom ? ` ${prenom}` : ""} !`,
        "",
        `*Changement de salle* pour votre cours de ${matiereName} :`,
        `- Date : *${creneau.date}* de ${creneau.heure_debut} à ${creneau.heure_fin}`,
        `- Nouvelle salle : *${creneau.salle || "à confirmer"}*`,
        "",
        "— EasyVacataire",
      ].join("\n");
      break;

    case "time_change":
      message = [
        `Bonjour${prenom ? ` ${prenom}` : ""} !`,
        "",
        `*Changement d'horaire* pour votre cours de ${matiereName} :`,
        `- Date : *${creneau.date}*`,
        `- Nouvel horaire : *${creneau.heure_debut} - ${creneau.heure_fin}*`,
        creneau.salle ? `- Salle : ${creneau.salle}` : "",
        "",
        "— EasyVacataire",
      ]
        .filter(Boolean)
        .join("\n");
      break;

    case "cancelled":
      message = [
        `Bonjour${prenom ? ` ${prenom}` : ""} !`,
        "",
        `Votre cours de ${matiereName} du *${creneau.date}* (${creneau.heure_debut} - ${creneau.heure_fin}) a été *annulé*.`,
        "",
        "Nous vous tiendrons informé de toute reprogrammation.",
        "",
        "— EasyVacataire",
      ].join("\n");
      break;

    case "confirmed":
      message = [
        `Bonjour${prenom ? ` ${prenom}` : ""} !`,
        "",
        `Votre cours de ${matiereName} a été *confirmé* :`,
        `- Date : *${creneau.date}* de ${creneau.heure_debut} à ${creneau.heure_fin}`,
        creneau.salle ? `- Salle : ${creneau.salle}` : "",
        "",
        "— EasyVacataire",
      ]
        .filter(Boolean)
        .join("\n");
      break;
  }

  await sendWhatsAppText(intervenant.phone, message);
}

/**
 * Send a reminder for an upcoming course.
 * Used by the cron job (J-1 and J-0 reminders).
 */
export async function sendCourseReminder(
  creneau: CreneauInfo,
  reminderType: "j-1" | "j-0"
) {
  if (!creneau.intervenant_phone) return;

  const prenom = creneau.intervenant_name || "";
  const matiere = creneau.matiere || "Cours";
  const when = reminderType === "j-1" ? "demain" : "aujourd'hui";

  const message = [
    `Bonjour${prenom ? ` ${prenom}` : ""} !`,
    "",
    `Rappel : vous avez cours de ${matiere} *${when}* :`,
    `- Horaire : *${creneau.heure_debut} - ${creneau.heure_fin}*`,
    creneau.salle ? `- Salle : *${creneau.salle}*` : "",
    "",
    "Bonne journée !",
    "— EasyVacataire",
  ]
    .filter(Boolean)
    .join("\n");

  await sendWhatsAppText(creneau.intervenant_phone, message);
}

/**
 * Send reminders for all courses on a given date.
 */
export async function sendRemindersForDate(
  targetDate: string,
  reminderType: "j-1" | "j-0"
) {
  const supabase = getServiceClient();

  const { data: creneaux } = await supabase
    .from("creneaux")
    .select(
      "date, heure_debut, heure_fin, salle, matieres(name), intervenants(phone, first_name)"
    )
    .eq("date", targetDate)
    .eq("status", "confirme");

  if (!creneaux) return;

  for (const c of creneaux) {
    const intervenant = (c as Record<string, unknown>).intervenants as Record<string, string> | null;
    const matiere = (c as Record<string, unknown>).matieres as Record<string, string> | null;

    if (!intervenant?.phone) continue;

    await sendCourseReminder(
      {
        date: c.date,
        heure_debut: c.heure_debut,
        heure_fin: c.heure_fin,
        salle: c.salle,
        matiere: matiere?.name,
        intervenant_phone: intervenant.phone,
        intervenant_name: intervenant.first_name,
      },
      reminderType
    );
  }
}
