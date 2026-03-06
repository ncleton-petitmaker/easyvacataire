import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  intervenant_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/),
  heure_fin: z.string().regex(/^\d{2}:\d{2}$/),
  source: z.enum(["web", "whatsapp"]).default("web"),
});

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const intervenantId = req.nextUrl.searchParams.get("intervenant_id");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  let query = supabase
    .from("disponibilites_intervenant")
    .select("*, intervenants(id, first_name, last_name)")
    .order("date", { ascending: true })
    .order("heure_debut", { ascending: true });

  if (intervenantId) {
    query = query.eq("intervenant_id", intervenantId);
  }
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((item) => createSchema.parse(item));

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("disponibilites_intervenant")
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

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("disponibilites_intervenant")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
