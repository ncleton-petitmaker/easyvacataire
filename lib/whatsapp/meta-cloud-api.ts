/**
 * WhatsApp Business Cloud API (Meta official) — direct HTTP client.
 * No Evolution API dependency for sending messages.
 */

const GRAPH_API_VERSION = "v22.0";

function getMetaConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID env vars");
  }
  return { token, phoneNumberId };
}

/**
 * Send a text message via WhatsApp Business Cloud API.
 * @param to  Phone number in international format, e.g. "+33612345678"
 * @param text  Message body
 */
export async function sendWhatsAppText(
  to: string,
  text: string
): Promise<{ messageId: string | null }> {
  const { token, phoneNumberId } = getMetaConfig();
  // Meta expects number without "+" prefix
  const recipient = to.startsWith("+") ? to.substring(1) : to;

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp Cloud API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  return { messageId: data.messages?.[0]?.id || null };
}
