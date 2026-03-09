import type { SupabaseClient } from "@supabase/supabase-js";

export type Match = {
  besoin: {
    id: string;
    date: string;
    heure_debut: string;
    heure_fin: string;
    salle: string | null;
    notes: string | null;
    matiere: { id: string; name: string; code: string | null } | null;
  };
  intervenants: {
    id: string;
    first_name: string;
    last_name: string;
    specialite: string | null;
    dispo_id: string;
  }[];
};

/**
 * For each open besoin, find intervenants whose disponibilites overlap.
 * A dispo overlaps a besoin if: same date AND dispo starts <= besoin starts AND dispo ends >= besoin ends.
 */
export async function findMatches(
  supabase: SupabaseClient,
  etablissementId: string
): Promise<Match[]> {
  // Fetch open besoins
  const { data: besoins } = await supabase
    .from("besoins_etablissement")
    .select("*, matieres(id, name, code)")
    .eq("etablissement_id", etablissementId)
    .eq("status", "ouvert")
    .order("date", { ascending: true })
    .order("heure_debut", { ascending: true });

  if (!besoins || besoins.length === 0) return [];

  // Get date range for optimization
  const dates = besoins.map((b) => b.date);
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  // Fetch all dispos for intervenants of this etablissement in the date range
  const { data: dispos } = await supabase
    .from("disponibilites_intervenant")
    .select("*, intervenants(id, first_name, last_name, specialite, etablissement_id)")
    .gte("date", minDate)
    .lte("date", maxDate);

  if (!dispos || dispos.length === 0) return [];

  // Filter dispos to intervenants of this etablissement
  const etabDispos = dispos.filter(
    (d) =>
      (d.intervenants as Record<string, unknown>)?.etablissement_id === etablissementId
  );

  // For each besoin, find matching dispos
  const matches: Match[] = [];

  for (const besoin of besoins) {
    const matchingIntervenants: Match["intervenants"] = [];

    for (const dispo of etabDispos) {
      if (
        dispo.date === besoin.date &&
        dispo.heure_debut <= besoin.heure_debut &&
        dispo.heure_fin >= besoin.heure_fin
      ) {
        const interv = dispo.intervenants as Record<string, string>;
        // Avoid duplicates (same intervenant, same besoin)
        if (!matchingIntervenants.some((m) => m.id === interv.id)) {
          matchingIntervenants.push({
            id: interv.id,
            first_name: interv.first_name,
            last_name: interv.last_name,
            specialite: interv.specialite || null,
            dispo_id: dispo.id,
          });
        }
      }
    }

    matches.push({
      besoin: {
        id: besoin.id,
        date: besoin.date,
        heure_debut: besoin.heure_debut,
        heure_fin: besoin.heure_fin,
        salle: besoin.salle,
        notes: besoin.notes,
        matiere: besoin.matieres || null,
      },
      intervenants: matchingIntervenants,
    });
  }

  return matches;
}

/** Convert "HH:MM" to minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Confirm a match: create a creneau and update the besoin status.
 */
export async function confirmMatch(
  supabase: SupabaseClient,
  besoinId: string,
  intervenantId: string
) {
  // Fetch besoin
  const { data: besoin, error: besoinError } = await supabase
    .from("besoins_etablissement")
    .select("*")
    .eq("id", besoinId)
    .single();

  if (besoinError || !besoin) {
    throw new Error("Besoin introuvable");
  }

  if (besoin.status !== "ouvert" && besoin.status !== "en_attente") {
    throw new Error("Ce besoin n'est plus disponible");
  }

  // Vérifier le buffer temps de route
  const { data: intervenant } = await supabase
    .from("intervenants")
    .select("buffer_before_minutes")
    .eq("id", intervenantId)
    .single();

  const bufferMin = intervenant?.buffer_before_minutes ?? 0;

  if (bufferMin > 0) {
    // Récupérer les créneaux confirmés du même jour
    const { data: existingCreneaux } = await supabase
      .from("creneaux")
      .select("heure_debut, heure_fin")
      .eq("intervenant_id", intervenantId)
      .eq("date", besoin.date)
      .in("status", ["confirme", "realise"]);

    const besoinStartMin = timeToMinutes(besoin.heure_debut);
    const besoinEndMin = timeToMinutes(besoin.heure_fin);

    for (const c of existingCreneaux || []) {
      const cStartMin = timeToMinutes(c.heure_debut);
      const cEndMin = timeToMinutes(c.heure_fin);
      // Buffer avant le créneau existant
      if (besoinEndMin > cStartMin - bufferMin && besoinEndMin <= cStartMin) {
        throw new Error(`Conflit : le créneau se termine trop près d'un autre (${bufferMin} min de temps de route requis avant ${c.heure_debut})`);
      }
      // Buffer avant le nouveau créneau
      if (cEndMin > besoinStartMin - bufferMin && cEndMin <= besoinStartMin) {
        throw new Error(`Conflit : un créneau existant se termine trop près (${bufferMin} min de temps de route requis avant ${besoin.heure_debut})`);
      }
      // Chevauchement direct
      if (besoinStartMin < cEndMin && besoinEndMin > cStartMin) {
        throw new Error(`Conflit : chevauchement avec un créneau existant ${c.heure_debut}–${c.heure_fin}`);
      }
    }
  }

  // Create creneau
  const { data: creneau, error: creneauError } = await supabase
    .from("creneaux")
    .insert({
      besoin_id: besoinId,
      intervenant_id: intervenantId,
      matiere_id: besoin.matiere_id,
      etablissement_id: besoin.etablissement_id,
      date: besoin.date,
      heure_debut: besoin.heure_debut,
      heure_fin: besoin.heure_fin,
      salle: besoin.salle,
      session_type: besoin.session_type || "TD",
      status: "confirme",
    })
    .select()
    .single();

  if (creneauError) {
    throw new Error(creneauError.message);
  }

  // Update besoin status
  await supabase
    .from("besoins_etablissement")
    .update({ status: "attribue" })
    .eq("id", besoinId);

  return creneau;
}
