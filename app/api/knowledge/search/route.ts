import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { searchKnowledge } from "@/lib/ai/embeddings";

/**
 * GET /api/knowledge/search?q=...&etablissement_id=...
 * Search knowledge base using vector similarity (or ILIKE fallback).
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const etablissementId = req.nextUrl.searchParams.get("etablissement_id");

  if (!query) {
    return NextResponse.json({ error: "q requis" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Try vector search if API key is available
  if (process.env.MISTRAL_API_KEY) {
    try {
      const vectorResults = await searchKnowledge(
        query,
        etablissementId || "",
        5
      );

      if (vectorResults.length > 0) {
        // Fetch full entries for titles
        const knowledgeIds = [
          ...new Set(vectorResults.map((r) => r.knowledge_id)),
        ];
        const { data: entries } = await supabase
          .from("knowledge_base")
          .select("id, title, category")
          .in("id", knowledgeIds);

        const entriesMap = new Map(
          (entries || []).map((e) => [e.id, e])
        );

        return NextResponse.json({
          results: vectorResults.map((r) => ({
            title: entriesMap.get(r.knowledge_id)?.title || "",
            content: r.chunk_text,
            category: entriesMap.get(r.knowledge_id)?.category || "",
            similarity: r.similarity,
          })),
        });
      }
    } catch (err) {
      console.error("[knowledge/search] Vector search failed:", err);
    }
  }

  // Fallback: ILIKE text search
  let textQuery = supabase
    .from("knowledge_base")
    .select("title, content, category")
    .eq("is_active", true)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(5);

  if (etablissementId) {
    textQuery = textQuery.eq("etablissement_id", etablissementId);
  }

  const { data, error } = await textQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    results: (data || []).map((d) => ({
      title: d.title,
      content: d.content,
      category: d.category,
    })),
  });
}
