/**
 * Evolution API client for sending WhatsApp messages.
 * Supports multi-tenant via optional instanceName parameter.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export function getEvolutionConfig() {
  return {
    url: process.env.EVOLUTION_API_URL!,
    key: process.env.EVOLUTION_API_KEY!,
    instance: process.env.EVOLUTION_INSTANCE || "univ-bot",
  };
}

export async function getInstanceForEtablissement(
  supabase: SupabaseClient,
  etablissementId: string
): Promise<string | undefined> {
  const { data } = await supabase
    .from("etablissements")
    .select("evolution_instance_name")
    .eq("id", etablissementId)
    .single();
  return data?.evolution_instance_name || undefined;
}

/**
 * Mark a message as read (blue double check) via Evolution API.
 * Works with both Baileys and WhatsApp Business API.
 */
export async function markAsRead(
  messageId: string,
  phone: string,
  instanceName?: string
): Promise<void> {
  try {
    const evo = getEvolutionConfig();
    const instance = instanceName || evo.instance;
    const number = phone.startsWith("+") ? phone.substring(1) : phone;

    await fetch(`${evo.url}/chat/markMessageAsRead/${instance}`, {
      method: "PUT",
      headers: {
        apikey: evo.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        readMessages: [
          {
            remoteJid: `${number}@s.whatsapp.net`,
            id: messageId,
            fromMe: false,
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[evolution] markAsRead failed:", err);
  }
}

/**
 * Send typing presence. Falls back silently on WhatsApp Business API
 * (no typing indicator support in Cloud API).
 */
export async function sendTypingPresence(
  phone: string,
  instanceName?: string
): Promise<void> {
  try {
    const evo = getEvolutionConfig();
    const instance = instanceName || evo.instance;
    const number = phone.startsWith("+") ? phone.substring(1) : phone;

    await fetch(`${evo.url}/chat/sendPresence/${instance}`, {
      method: "POST",
      headers: {
        apikey: evo.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number,
        presence: "composing",
        delay: 10000,
      }),
    }).catch(() => {});
  } catch {
    // Non-critical
  }
}

export async function sendWhatsAppText(
  phone: string,
  text: string,
  instanceName?: string
): Promise<{ messageId: string | null }> {
  const evo = getEvolutionConfig();
  const instance = instanceName || evo.instance;
  const number = phone.startsWith("+") ? phone.substring(1) : phone;

  // Convert Markdown to WhatsApp formatting
  const waText = text
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*");

  const response = await fetch(
    `${evo.url}/message/sendText/${instance}`,
    {
      method: "POST",
      headers: {
        apikey: evo.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ number, text: waText, delay: 1200 }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return { messageId: result.key?.id || null };
}
