import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("etablissements")
    .select("*, intervenants(count)")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (data || []).map((e: Record<string, unknown>) => ({
    ...e,
    intervenants_count:
      Array.isArray(e.intervenants) && e.intervenants.length > 0
        ? (e.intervenants[0] as { count: number }).count
        : 0,
    intervenants: undefined,
  }));

  return NextResponse.json(formatted);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug invalide" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("etablissements")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Un etablissement avec ce slug existe deja" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("etablissements")
      .insert({ name: name.trim(), slug })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
