import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { findMatches, confirmMatch } from "@/lib/matching/engine";
import { createDemande } from "@/lib/demandes/engine";

export async function GET(req: NextRequest) {
  const etablissementId = req.nextUrl.searchParams.get("etablissement_id");
  if (!etablissementId) {
    return NextResponse.json(
      { error: "etablissement_id requis" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  const matches = await findMatches(supabase, etablissementId);
  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { besoin_id, intervenant_id, mode = "request" } = body;

    if (!besoin_id || !intervenant_id) {
      return NextResponse.json(
        { error: "besoin_id et intervenant_id requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    if (mode === "direct") {
      // Confirmation directe sans demande WhatsApp
      const creneau = await confirmMatch(supabase, besoin_id, intervenant_id);
      return NextResponse.json(creneau, { status: 201 });
    }

    // Mode "request" : envoyer une demande WhatsApp au vacataire
    const { data: besoin } = await supabase
      .from("besoins_etablissement")
      .select("etablissement_id")
      .eq("id", besoin_id)
      .single();

    if (!besoin) {
      return NextResponse.json(
        { error: "Besoin introuvable" },
        { status: 404 }
      );
    }

    const demande = await createDemande(
      supabase,
      besoin_id,
      intervenant_id,
      besoin.etablissement_id
    );

    return NextResponse.json(
      { demande, message: "Demande envoyée au vacataire" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[matching] Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
