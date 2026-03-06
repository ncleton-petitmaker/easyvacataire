import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * Public endpoint: validate a dispo token and return intervenant info + existing dispos.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Find intervenant with this token
  const { data: intervenants } = await supabase
    .from("intervenants")
    .select("id, first_name, last_name, metadata")
    .eq("is_active", true);

  const intervenant = intervenants?.find((i) => {
    const meta = i.metadata as Record<string, string> | null;
    return meta?.dispo_token === token;
  });

  if (!intervenant) {
    return NextResponse.json(
      { error: "Lien invalide ou expire" },
      { status: 404 }
    );
  }

  // Check expiry
  const meta = intervenant.metadata as Record<string, string>;
  if (meta.dispo_token_expires && new Date(meta.dispo_token_expires) < new Date()) {
    return NextResponse.json(
      { error: "Ce lien a expire. Demandez-en un nouveau." },
      { status: 410 }
    );
  }

  // Fetch existing dispos
  const { data: slots } = await supabase
    .from("disponibilites_intervenant")
    .select("id, date, heure_debut, heure_fin")
    .eq("intervenant_id", intervenant.id)
    .order("date", { ascending: true })
    .order("heure_debut", { ascending: true });

  return NextResponse.json({
    intervenant: {
      id: intervenant.id,
      first_name: intervenant.first_name,
      last_name: intervenant.last_name,
    },
    slots: slots || [],
  });
}
