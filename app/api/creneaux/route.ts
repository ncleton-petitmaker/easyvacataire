import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const etablissementId = req.nextUrl.searchParams.get("etablissement_id");
  const intervenantId = req.nextUrl.searchParams.get("intervenant_id");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  let query = supabase
    .from("creneaux")
    .select(
      "*, intervenants(id, first_name, last_name, phone), matieres(id, name, code)"
    )
    .eq("status", "confirme")
    .order("date", { ascending: true })
    .order("heure_debut", { ascending: true });

  if (etablissementId) {
    query = query.eq("etablissement_id", etablissementId);
  }
  if (intervenantId) {
    query = query.eq("intervenant_id", intervenantId);
  }
  if (from) {
    query = query.gte("date", from);
  }
  if (to) {
    query = query.lte("date", to);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
