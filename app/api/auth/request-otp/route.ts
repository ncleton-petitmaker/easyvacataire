import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase/server";
import { sendOtpViaWhatsApp } from "@/lib/whatsapp/send-otp";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\+\d{8,15}$/.test(phone)) {
      return NextResponse.json(
        { error: "Numero de telephone invalide" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Rate limit: 1 OTP per phone per 60s
    const { data: recent } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("phone", phone)
      .gte("created_at", new Date(Date.now() - 60_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (recent && recent.length > 0) {
      return NextResponse.json(
        { error: "Veuillez patienter 60 secondes avant de redemander un code" },
        { status: 429 }
      );
    }

    // Verify phone belongs to an active intervenant, admin, or super_admin
    const { data: intervenant } = await supabase
      .from("intervenants")
      .select("id")
      .eq("phone", phone)
      .eq("is_active", true)
      .limit(1);

    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("phone", phone)
      .eq("is_active", true)
      .limit(1);

    if (
      (!intervenant || intervenant.length === 0) &&
      (!superAdmin || superAdmin.length === 0)
    ) {
      return NextResponse.json(
        { error: "Numero non reconnu" },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // Hash and store
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabase.from("otp_codes").insert({
      phone,
      code_hash: codeHash,
      expires_at: expiresAt,
    });

    // Send via WhatsApp
    await sendOtpViaWhatsApp(phone, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[request-otp] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du code" },
      { status: 500 }
    );
  }
}
