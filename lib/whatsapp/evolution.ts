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
 * Mark as read + show typing indicator via Meta Cloud API directly.
 * Evolution API ne supporte pas le typing sur Business API,
 * donc on appelle graph.facebook.com directement.
 */
export async function markAsReadAndType(
  whatsappMessageId: string
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) return;

  try {
    await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: whatsappMessageId,
          typing_indicator: { type: "text" },
        }),
      }
    );
  } catch (err) {
    console.error("[whatsapp] markAsReadAndType failed:", err);
  }
}

/**
 * Alias pour compatibilité — appelle markAsReadAndType si le messageId est fourni.
 */
export async function markAsRead(
  messageId: string,
  _phone: string,
  _instanceName?: string
): Promise<void> {
  await markAsReadAndType(messageId);
}

/**
 * Send typing presence via Meta Cloud API.
 * Envoie le typing indicator directement à Meta (pas via Evolution).
 */
export async function sendTypingPresence(
  _phone: string,
  _instanceName?: string,
  whatsappMessageId?: string
): Promise<void> {
  if (whatsappMessageId) {
    await markAsReadAndType(whatsappMessageId);
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
