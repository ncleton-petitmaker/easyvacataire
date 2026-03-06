import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * Generate a temporary token for an intervenant to fill in their dispos
 * without being logged in (link sent via WhatsApp).
 */
export async function POST(req: NextRequest) {
  const { intervenant_id } = await req.json();
  if (!intervenant_id) {
    return NextResponse.json(
      { error: "intervenant_id requis" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Verify intervenant exists
  const { data: intervenant } = await supabase
    .from("intervenants")
    .select("id, first_name")
    .eq("id", intervenant_id)
    .eq("is_active", true)
    .single();

  if (!intervenant) {
    return NextResponse.json(
      { error: "Intervenant introuvable" },
      { status: 404 }
    );
  }

  // Generate token (valid 7 days)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Store in metadata of the intervenant (simple approach)
  await supabase
    .from("intervenants")
    .update({
      metadata: { dispo_token: token, dispo_token_expires: expiresAt },
    } as Record<string, unknown>)
    .eq("id", intervenant_id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${appUrl}/dispos/${token}`;

  return NextResponse.json({ token, link, expires_at: expiresAt });
}
