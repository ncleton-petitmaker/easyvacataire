import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppText } from "@/lib/whatsapp/meta-cloud-api";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "easyvacataire_verify_2026";

// Webhook verification (GET) — required by Meta
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Dedup
const seen = new Map<string, number>();
function isDuplicate(id: string): boolean {
  const now = Date.now();
  for (const [k, ts] of seen) if (now - ts > 30_000) seen.delete(k);
  if (seen.has(id)) return true;
  seen.set(id, now);
  return false;
}

// Incoming messages (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Meta sends a specific structure
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.[0]) {
      return NextResponse.json({ ok: true });
    }

    const msg = value.messages[0];
    const messageId = msg.id;
    if (!messageId || isDuplicate(messageId)) {
      return NextResponse.json({ ok: true });
    }

    // Extract phone (Meta sends without +)
    const from = msg.from; // e.g. "33760177267"
    const phone = "+" + from;
    const text = msg.text?.body || "";

    console.log("[meta-webhook] Message from", phone, ":", text);

    if (!text.trim()) return NextResponse.json({ ok: true });

    const supabase = getServiceClient();

    // Check if user has a pending OTP (requested in last 5 min)
    const { data: pendingOtp } = await supabase
      .from("otp_codes")
      .select("id, code_hash")
      .eq("phone", phone)
      .eq("used", false)
      .eq("otp_sent", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (pendingOtp && pendingOtp.length > 0) {
      // User has a pending OTP — generate a new code and send it
      const code = crypto.randomInt(100000, 999999).toString();
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Update the pending OTP with new code
      await supabase
        .from("otp_codes")
        .update({ code_hash: codeHash, expires_at: expiresAt, otp_sent: true })
        .eq("id", pendingOtp[0].id);

      // Send code as reply (free within 24h window)
      await sendWhatsAppText(
        phone,
        `Votre code de connexion EasyVacataire : *${code}*\n\nCe code expire dans 5 minutes.\nNe le partagez avec personne.`
      );

      console.log("[meta-webhook] OTP sent to", phone);
      return NextResponse.json({ ok: true });
    }

    // No pending OTP — forward to chat agent (existing behavior)
    const { data: intervenant } = await supabase
      .from("intervenants")
      .select("id, etablissement_id, first_name")
      .eq("phone", phone)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!intervenant) {
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

    if (conversation) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        direction: "inbound",
        content: text,
        whatsapp_message_id: messageId,
      });
    }

    // Forward to chat agent
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await fetch(`${appUrl}/api/chat-agent`, {
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[meta-webhook] Error:", error);
    return NextResponse.json({ ok: true });
  }
}
