import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { markAsRead } from "@/lib/whatsapp/evolution";

// Simple deduplication (30s TTL)
const seen = new Map<string, number>();
const DEDUP_TTL = 30_000;

function isDuplicate(messageId: string): boolean {
  const now = Date.now();
  // Clean old entries
  for (const [key, ts] of seen) {
    if (now - ts > DEDUP_TTL) seen.delete(key);
  }
  if (seen.has(messageId)) return true;
  seen.set(messageId, now);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body?.event;

    if (event !== "messages.upsert") {
      return NextResponse.json({ ok: true });
    }

    const message = body?.data;
    if (!message) return NextResponse.json({ ok: true });

    // Skip outgoing messages and group messages
    if (message.key?.fromMe) return NextResponse.json({ ok: true });
    if (message.key?.remoteJid?.includes("@g.us")) {
      return NextResponse.json({ ok: true });
    }

    const messageId = message.key?.id;
    if (!messageId || isDuplicate(messageId)) {
      return NextResponse.json({ ok: true });
    }

    // Extract phone and text
    const remoteJid = message.key.remoteJid || "";
    const phone = "+" + remoteJid.replace("@s.whatsapp.net", "");
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    if (!text.trim()) return NextResponse.json({ ok: true });

    // Mark message as read immediately (blue double check)
    await markAsRead(messageId, phone);

    const supabase = getServiceClient();

    // Find intervenant by phone
    const { data: intervenant } = await supabase
      .from("intervenants")
      .select("id, etablissement_id, first_name")
      .eq("phone", phone)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!intervenant) {
      // Unknown number — ignore for now
      return NextResponse.json({ ok: true });
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("phone", phone)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!conversation) {
      const { data: created } = await supabase
        .from("conversations")
        .insert({
          etablissement_id: intervenant.etablissement_id,
          intervenant_id: intervenant.id,
          phone,
        })
        .select("id")
        .single();
      conversation = created;
    }

    // Store inbound message
    if (conversation) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        direction: "inbound",
        content: text,
        whatsapp_message_id: messageId,
      });
    }

    // Forward to chat agent (always use localhost to avoid SSL/network issues)
    const internalUrl = "http://localhost:3000";
    const agentRes = await fetch(`${internalUrl}/api/chat-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        text,
        intervenantId: intervenant.id,
        etablissementId: intervenant.etablissement_id,
        conversationId: conversation?.id,
      }),
    });

    if (!agentRes.ok) {
      console.error("[whatsapp-webhook] chat-agent error:", agentRes.status, await agentRes.text());
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[whatsapp-webhook] Error:", error);
    return NextResponse.json({ ok: true });
  }
}
