import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { indexKnowledgeEntry } from "@/lib/ai/embeddings";

/**
 * POST /api/knowledge/embed
 * Trigger embedding generation for a knowledge entry.
 * Body: { knowledge_id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { knowledge_id } = await req.json();
    if (!knowledge_id) {
      return NextResponse.json(
        { error: "knowledge_id requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    const { data: entry, error } = await supabase
      .from("knowledge_base")
      .select("id, etablissement_id, title, content")
      .eq("id", knowledge_id)
      .single();

    if (error || !entry) {
      return NextResponse.json(
        { error: "Entrée non trouvée" },
        { status: 404 }
      );
    }

    const chunksIndexed = await indexKnowledgeEntry(
      entry.id,
      entry.etablissement_id,
      entry.title,
      entry.content
    );

    return NextResponse.json({
      ok: true,
      knowledge_id: entry.id,
      chunks_indexed: chunksIndexed,
    });
  } catch (error) {
    console.error("[knowledge/embed] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'indexation" },
      { status: 500 }
    );
  }
}
