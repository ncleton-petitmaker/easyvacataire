import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const etablissementId = req.nextUrl.searchParams.get("etablissement_id");
  if (!etablissementId) {
    return NextResponse.json(
      { error: "etablissement_id requis" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("id, phone, status, created_at, updated_at, intervenants(first_name, last_name)")
    .eq("etablissement_id", etablissementId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: data });
}
