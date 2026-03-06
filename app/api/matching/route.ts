import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { findMatches, confirmMatch } from "@/lib/matching/engine";

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
    const { besoin_id, intervenant_id } = body;

    if (!besoin_id || !intervenant_id) {
      return NextResponse.json(
        { error: "besoin_id et intervenant_id requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    const creneau = await confirmMatch(supabase, besoin_id, intervenant_id);
    return NextResponse.json(creneau, { status: 201 });
  } catch (error) {
    console.error("[matching] Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
