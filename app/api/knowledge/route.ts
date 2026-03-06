import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  etablissement_id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(["campus", "admin", "pedagogie", "faq"]).optional(),
  source_type: z.string().default("text"),
});

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const etablissementId = req.nextUrl.searchParams.get("etablissement_id");

  let query = supabase
    .from("knowledge_base")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

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
      .from("knowledge_base")
      .insert(parsed)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger embedding generation (non-blocking)
    if (process.env.MISTRAL_API_KEY && data) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${appUrl}/api/knowledge/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledge_id: data.id }),
      }).catch((err) =>
        console.error("[knowledge] Embedding trigger failed:", err)
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
