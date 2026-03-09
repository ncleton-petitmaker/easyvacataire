/**
 * Moteur de demandes de disponibilité.
 * Gère la file d'attente des demandes envoyées aux vacataires via WhatsApp.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { confirmMatch } from "@/lib/matching/engine";
import { sendWhatsAppText } from "@/lib/whatsapp/evolution";

const EXPIRY_HOURS = 48;

function generateToken(): string {
  return randomBytes(16).toString("hex");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Crée une demande de disponibilité pour un besoin/intervenant.
 */
export async function createDemande(
  supabase: SupabaseClient,
  besoinId: string,
  intervenantId: string,
  etablissementId: string,
  priority: number = 0
) {
  const token = generateToken();

  const { data, error } = await supabase
    .from("demandes_disponibilite")
    .insert({
      besoin_id: besoinId,
      intervenant_id: intervenantId,
      etablissement_id: etablissementId,
      status: "pending",
      priority,
      response_token: token,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Mettre le besoin en attente
  await supabase
    .from("besoins_etablissement")
    .update({ status: "en_attente" })
    .eq("id", besoinId);

  // Traiter la file d'attente
  await processQueue(supabase, intervenantId);

  return data;
}

/**
 * Traite la file d'attente : envoie la prochaine demande si aucune n'est en cours.
 */
export async function processQueue(
  supabase: SupabaseClient,
  intervenantId: string
) {
  // Vérifier s'il y a déjà une demande envoyée en attente de réponse
  const { data: current } = await supabase
    .from("demandes_disponibilite")
    .select("id")
    .eq("intervenant_id", intervenantId)
    .eq("status", "sent")
    .limit(1)
    .single();

  if (current) return; // Déjà une demande en cours

  // Récupérer la prochaine demande pending
  const { data: next } = await supabase
    .from("demandes_disponibilite")
    .select(
      "*, besoins_etablissement(date, heure_debut, heure_fin, salle, session_type, matieres(name))"
    )
    .eq("intervenant_id", intervenantId)
    .eq("status", "pending")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!next) return; // Rien en attente

  // Récupérer les infos de l'intervenant
  const { data: intervenant } = await supabase
    .from("intervenants")
    .select("phone, first_name")
    .eq("id", intervenantId)
    .single();

  if (!intervenant?.phone) return;

  const besoin = next.besoins_etablissement as Record<string, unknown>;
  const matiere = besoin.matieres as Record<string, string> | null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.easyvacataire.fr";

  const message = [
    `Bonjour${intervenant.first_name ? ` ${intervenant.first_name}` : ""} !`,
    "",
    "L'établissement vous propose un créneau :",
    matiere?.name ? `- Matière : *${matiere.name}*` : "",
    `- Date : *${formatDate(besoin.date as string)}*`,
    `- Horaire : *${besoin.heure_debut} - ${besoin.heure_fin}*`,
    besoin.salle ? `- Salle : ${besoin.salle}` : "",
    besoin.session_type ? `- Type : ${besoin.session_type}` : "",
    "",
    "Êtes-vous disponible ?",
    "Répondez *O* (oui) ou *N* (non)",
    "",
    `Ou validez en ligne : ${appUrl}/demande/${next.response_token}`,
    "",
    "— EasyVacataire",
  ]
    .filter(Boolean)
    .join("\n");

  // Envoyer le message WhatsApp
  const { messageId } = await sendWhatsAppText(intervenant.phone, message);

  // Mettre à jour la demande
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + EXPIRY_HOURS);

  await supabase
    .from("demandes_disponibilite")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      whatsapp_message_id: messageId,
    })
    .eq("id", next.id);

  console.log(
    `[demandes] Demande envoyée à ${intervenant.first_name} pour le ${besoin.date}`
  );
}

/**
 * Traite la réponse O/N d'un intervenant.
 * Retourne un message de confirmation à envoyer.
 */
export async function handleResponse(
  supabase: SupabaseClient,
  intervenantId: string,
  accepted: boolean
): Promise<string> {
  // Trouver la demande en cours
  const { data: demande } = await supabase
    .from("demandes_disponibilite")
    .select(
      "*, besoins_etablissement(date, heure_debut, heure_fin, salle, matieres(name))"
    )
    .eq("intervenant_id", intervenantId)
    .eq("status", "sent")
    .limit(1)
    .single();

  if (!demande) {
    return "Aucune demande en attente de réponse.";
  }

  const besoin = demande.besoins_etablissement as Record<string, unknown>;
  const matiere = besoin.matieres as Record<string, string> | null;
  const dateStr = formatDate(besoin.date as string);

  if (accepted) {
    // Accepter : créer le créneau
    await supabase
      .from("demandes_disponibilite")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", demande.id);

    try {
      await confirmMatch(supabase, demande.besoin_id, intervenantId);
    } catch (err) {
      console.error("[demandes] Erreur confirmMatch:", err);
      return "Désolé, une erreur est survenue lors de la confirmation. Contactez l'administration.";
    }

    // Envoyer la prochaine demande
    await processQueue(supabase, intervenantId);

    return [
      `Le créneau de *${matiere?.name || "cours"}* du *${dateStr}* (${besoin.heure_debut} - ${besoin.heure_fin}) a été *confirmé*.`,
      "",
      "Merci pour votre réponse !",
    ].join("\n");
  } else {
    // Refuser : remettre le besoin en ouvert
    await supabase
      .from("demandes_disponibilite")
      .update({ status: "refused", responded_at: new Date().toISOString() })
      .eq("id", demande.id);

    await supabase
      .from("besoins_etablissement")
      .update({ status: "ouvert" })
      .eq("id", demande.besoin_id);

    // Envoyer la prochaine demande
    await processQueue(supabase, intervenantId);

    return [
      `Bien noté, le créneau du *${dateStr}* a été *refusé*.`,
      "",
      "L'établissement sera informé.",
    ].join("\n");
  }
}

/**
 * Traite une réponse via token web (sans authentification).
 */
export async function handleWebResponse(
  supabase: SupabaseClient,
  token: string,
  accepted: boolean
): Promise<{ success: boolean; message: string }> {
  const { data: demande } = await supabase
    .from("demandes_disponibilite")
    .select("id, intervenant_id, status")
    .eq("response_token", token)
    .single();

  if (!demande) {
    return { success: false, message: "Lien invalide ou expiré." };
  }

  if (demande.status !== "sent") {
    return {
      success: false,
      message:
        demande.status === "accepted"
          ? "Vous avez déjà accepté ce créneau."
          : demande.status === "refused"
            ? "Vous avez déjà refusé ce créneau."
            : "Cette demande a expiré.",
    };
  }

  const msg = await handleResponse(supabase, demande.intervenant_id, accepted);
  return { success: true, message: msg };
}

/**
 * Expire les demandes sans réponse après 48h.
 */
export async function expireStale(supabase: SupabaseClient) {
  const { data: stale } = await supabase
    .from("demandes_disponibilite")
    .select("id, besoin_id, intervenant_id")
    .eq("status", "sent")
    .lt("expires_at", new Date().toISOString());

  if (!stale || stale.length === 0) return 0;

  for (const demande of stale) {
    await supabase
      .from("demandes_disponibilite")
      .update({ status: "expired", responded_at: new Date().toISOString() })
      .eq("id", demande.id);

    // Remettre le besoin en ouvert
    await supabase
      .from("besoins_etablissement")
      .update({ status: "ouvert" })
      .eq("id", demande.besoin_id);

    // Traiter la file pour cet intervenant
    await processQueue(supabase, demande.intervenant_id);
  }

  return stale.length;
}

/**
 * Récupère les demandes en attente pour un intervenant (pour le web UI).
 */
export async function getPendingDemandes(
  supabase: SupabaseClient,
  intervenantId: string
) {
  const { data } = await supabase
    .from("demandes_disponibilite")
    .select(
      "id, status, response_token, sent_at, expires_at, created_at, besoins_etablissement(date, heure_debut, heure_fin, salle, session_type, matieres(name, code))"
    )
    .eq("intervenant_id", intervenantId)
    .in("status", ["pending", "sent"])
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  return data || [];
}
