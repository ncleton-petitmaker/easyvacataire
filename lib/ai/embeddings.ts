/**
 * Mistral embeddings pipeline for RAG.
 * Chunks text, generates 1024D embeddings, stores in knowledge_embeddings.
 */

import { getServiceClient } from "@/lib/supabase/server";

const MISTRAL_EMBED_URL = "https://api.mistral.ai/v1/embeddings";
const CHUNK_SIZE = 500; // characters per chunk
const CHUNK_OVERLAP = 50;

function getApiKey(): string {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY is not set");
  return key;
}

/**
 * Split text into overlapping chunks for embedding.
 */
export function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + CHUNK_SIZE;

    // Try to break at sentence boundary
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastPeriod = slice.lastIndexOf(".");
      const lastNewline = slice.lastIndexOf("\n");
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > CHUNK_SIZE * 0.3) {
        end = start + breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
  }

  return chunks.filter((c) => c.length > 10);
}

/**
 * Generate embeddings via Mistral API.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const res = await fetch(MISTRAL_EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: "mistral-embed",
      input: texts,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mistral Embeddings error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.data.map(
    (d: { embedding: number[] }) => d.embedding
  );
}

/**
 * Generate a single embedding for a query string.
 */
export async function generateQueryEmbedding(
  query: string
): Promise<number[]> {
  const embeddings = await generateEmbeddings([query]);
  return embeddings[0];
}

/**
 * Index a knowledge base entry: chunk text, embed, store in knowledge_embeddings.
 * Deletes existing embeddings for this entry first (re-index).
 */
export async function indexKnowledgeEntry(
  knowledgeId: string,
  etablissementId: string,
  title: string,
  content: string
): Promise<number> {
  const supabase = getServiceClient();

  // Delete existing embeddings for this entry
  await supabase
    .from("knowledge_embeddings")
    .delete()
    .eq("knowledge_id", knowledgeId);

  // Chunk the content (prepend title for context)
  const fullText = `${title}\n\n${content}`;
  const chunks = chunkText(fullText);

  if (chunks.length === 0) return 0;

  // Generate embeddings in batches of 10
  const batchSize = 10;
  let totalInserted = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await generateEmbeddings(batch);

    const rows = batch.map((chunk, idx) => ({
      knowledge_id: knowledgeId,
      etablissement_id: etablissementId,
      chunk_text: chunk,
      chunk_index: i + idx,
      embedding: JSON.stringify(embeddings[idx]),
    }));

    const { error } = await supabase
      .from("knowledge_embeddings")
      .insert(rows);

    if (error) {
      console.error("[embeddings] Insert error:", error);
      throw error;
    }

    totalInserted += rows.length;
  }

  return totalInserted;
}

/**
 * Search knowledge base using vector similarity.
 */
export async function searchKnowledge(
  query: string,
  etablissementId: string,
  matchCount: number = 5,
  threshold: number = 0.5
): Promise<
  Array<{
    knowledge_id: string;
    chunk_text: string;
    similarity: number;
  }>
> {
  const supabase = getServiceClient();
  const queryEmbedding = await generateQueryEmbedding(query);

  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: threshold,
    match_count: matchCount,
    filter_etablissement: etablissementId,
  });

  if (error) {
    console.error("[embeddings] Search error:", error);
    return [];
  }

  return data || [];
}
