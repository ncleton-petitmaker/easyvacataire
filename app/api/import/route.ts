import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { parseCSV } from "@/lib/import/csv-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const etablissementId = formData.get("etablissement_id") as string;
    const type = formData.get("type") as string; // 'besoins' | 'intervenants'

    if (!file || !etablissementId) {
      return NextResponse.json(
        { error: "Fichier et etablissement_id requis" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Fichier vide ou format invalide" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    if (type === "besoins") {
      return await importBesoins(supabase, rows, etablissementId);
    } else if (type === "intervenants") {
      return await importIntervenants(supabase, rows, etablissementId);
    }

    return NextResponse.json({ error: "Type d'import invalide" }, { status: 400 });
  } catch (error) {
    console.error("[import] Error:", error);
    return NextResponse.json({ error: "Erreur lors de l'import" }, { status: 500 });
  }
}

async function importBesoins(
  supabase: ReturnType<typeof getServiceClient>,
  rows: Record<string, string>[],
  etablissementId: string
) {
  // Fetch matieres for name->id mapping
  const { data: matieres } = await supabase
    .from("matieres")
    .select("id, name, code")
    .eq("etablissement_id", etablissementId);

  const matieresMap = new Map<string, string>();
  for (const m of matieres || []) {
    matieresMap.set(m.name.toLowerCase(), m.id);
    if (m.code) matieresMap.set(m.code.toLowerCase(), m.id);
  }

  const besoins = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const date = row.date || row.Date;
    const heureDebut = row.heure_debut || row["heure debut"] || row.debut || row.Debut;
    const heureFin = row.heure_fin || row["heure fin"] || row.fin || row.Fin;
    const salle = row.salle || row.Salle || "";
    const matiereName = row.matiere || row.Matiere || row.module || row.Module || "";
    const notes = row.notes || row.Notes || "";

    if (!date || !heureDebut || !heureFin) {
      errors.push(`Ligne ${i + 2}: date, heure_debut et heure_fin sont requis`);
      continue;
    }

    const matiereId = matiereName
      ? matieresMap.get(matiereName.toLowerCase())
      : undefined;

    besoins.push({
      etablissement_id: etablissementId,
      matiere_id: matiereId || null,
      date,
      heure_debut: heureDebut.length === 5 ? heureDebut : heureDebut.slice(0, 5),
      heure_fin: heureFin.length === 5 ? heureFin : heureFin.slice(0, 5),
      salle: salle || null,
      notes: notes || null,
    });
  }

  if (besoins.length > 0) {
    const { error } = await supabase
      .from("besoins_etablissement")
      .insert(besoins);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    imported: besoins.length,
    errors,
    total: rows.length,
  });
}

async function importIntervenants(
  supabase: ReturnType<typeof getServiceClient>,
  rows: Record<string, string>[],
  etablissementId: string
) {
  const intervenants = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const firstName = row.prenom || row.Prenom || row.first_name || "";
    const lastName = row.nom || row.Nom || row.last_name || "";
    const phone = row.telephone || row.Telephone || row.phone || row.Phone || "";
    const email = row.email || row.Email || "";
    const specialite = row.specialite || row.Specialite || "";

    if (!firstName || !lastName || !phone) {
      errors.push(`Ligne ${i + 2}: prenom, nom et telephone sont requis`);
      continue;
    }

    const formattedPhone = phone.startsWith("+") ? phone : `+33${phone.replace(/^0/, "")}`;

    intervenants.push({
      etablissement_id: etablissementId,
      first_name: firstName,
      last_name: lastName,
      phone: formattedPhone,
      email: email || null,
      specialite: specialite || null,
    });
  }

  if (intervenants.length > 0) {
    const { error } = await supabase
      .from("intervenants")
      .insert(intervenants);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    imported: intervenants.length,
    errors,
    total: rows.length,
  });
}
