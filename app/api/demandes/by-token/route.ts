import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token requis" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("demandes_disponibilite")
    .select(
      "id, status, besoins_etablissement(date, heure_debut, heure_fin, salle, session_type, matieres(name))"
    )
    .eq("response_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  return NextResponse.json(data);
}
