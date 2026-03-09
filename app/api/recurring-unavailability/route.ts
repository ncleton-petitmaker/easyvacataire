import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  intervenant_id: z.string().min(1),
  day_of_week: z.number().int().min(-1).max(6).nullable(), // null=tous les jours, -1=lun-ven, 0-6=jour
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/),
  heure_fin: z.string().regex(/^\d{2}:\d{2}$/),
  label: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const intervenantId = req.nextUrl.searchParams.get("intervenant_id");
  if (!intervenantId) {
    return NextResponse.json({ error: "intervenant_id requis" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("recurring_unavailability")
    .select("*")
    .eq("intervenant_id", intervenantId)
    .order("day_of_week")
    .order("heure_debut");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[recurring-unavailability] POST body:", JSON.stringify(body));
    const parsed = createSchema.parse(body);
    console.log("[recurring-unavailability] parsed:", JSON.stringify(parsed));

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("recurring_unavailability")
      .insert(parsed)
      .select()
      .single();

    if (error) {
      console.error("[recurring-unavailability] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[recurring-unavailability] catch error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("recurring_unavailability")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
