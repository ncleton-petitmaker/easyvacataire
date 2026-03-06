import { getServiceClient } from "@/lib/supabase/server";
import type { MistralMessage } from "./mistral";

interface MessageRow {
  direction: string;
  content: string;
  created_at: string;
}

/**
 * Load conversation history from DB and convert to Mistral message format.
 * Returns messages in chronological order (oldest first).
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 20
): Promise<MistralMessage[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("messages")
    .select("direction, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    if (error) console.error("Failed to load conversation history:", error);
    return [];
  }

  // Reverse to chronological order
  const messages = (data as MessageRow[]).reverse();

  // Convert + merge consecutive same-role messages
  const result: MistralMessage[] = [];
  for (const msg of messages) {
    if (!msg.content) continue;
    const role = msg.direction === "inbound" ? "user" : "assistant";
    const last = result[result.length - 1];
    if (last && last.role === role) {
      last.content = last.content + "\n" + msg.content;
    } else {
      result.push({ role, content: msg.content });
    }
  }

  return result;
}
