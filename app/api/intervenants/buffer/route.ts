import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const intervenantId = req.nextUrl.searchParams.get("intervenant_id");
  if (!intervenantId) {
    return NextResponse.json({ error: "intervenant_id requis" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("intervenants")
    .select("buffer_before_minutes")
    .eq("id", intervenantId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ buffer_before_minutes: data?.buffer_before_minutes ?? 0 });
}

export async function PATCH(req: NextRequest) {
  const { intervenant_id, buffer_before_minutes } = await req.json();
  if (!intervenant_id || buffer_before_minutes == null) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("intervenants")
    .update({ buffer_before_minutes: Math.max(0, Math.min(180, buffer_before_minutes)) })
    .eq("id", intervenant_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
