import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  etablissement_id: z.string().uuid(),
  phone: z.string().regex(/^\+\d{8,15}$/),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  specialite: z.string().optional(),
  role: z.enum(["intervenant", "admin"]).default("intervenant"),
});

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const etablissementId = req.nextUrl.searchParams.get("etablissement_id");

  let query = supabase
    .from("intervenants")
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  if (etablissementId) {
    query = query.eq("etablissement_id", etablissementId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("intervenants")
      .insert(parsed)
      .select()
      .single();

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
