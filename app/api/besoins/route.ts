import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  etablissement_id: z.string().uuid(),
  matiere_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/),
  heure_fin: z.string().regex(/^\d{2}:\d{2}$/),
  salle: z.string().optional(),
  notes: z.string().optional(),
  session_type: z.enum(["CM", "TD", "TP"]).default("TD"),
});

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const etablissementId = req.nextUrl.searchParams.get("etablissement_id");
  const status = req.nextUrl.searchParams.get("status");

  let query = supabase
    .from("besoins_etablissement")
    .select("*, matieres(id, name, code)")
    .order("date", { ascending: true })
    .order("heure_debut", { ascending: true });

  if (etablissementId) {
    query = query.eq("etablissement_id", etablissementId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support batch insert
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((item) => createSchema.parse(item));

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("besoins_etablissement")
      .insert(parsed)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
