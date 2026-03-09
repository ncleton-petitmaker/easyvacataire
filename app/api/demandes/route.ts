import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getPendingDemandes } from "@/lib/demandes/engine";

export async function GET(req: NextRequest) {
  const intervenantId = req.nextUrl.searchParams.get("intervenant_id");

  if (!intervenantId) {
    return NextResponse.json(
      { error: "intervenant_id requis" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  const demandes = await getPendingDemandes(supabase, intervenantId);
  return NextResponse.json(demandes);
}
