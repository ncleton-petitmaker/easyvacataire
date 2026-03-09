import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase/server";
import { sendOtpEmail } from "@/lib/email/send-otp";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase().trim();
    const supabase = getServiceClient();

    // Rate limit: 1 OTP per email per 60s
    const { data: recent } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("phone", lowerEmail)
      .gte("created_at", new Date(Date.now() - 60_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (recent && recent.length > 0) {
      return NextResponse.json(
        { error: "Veuillez patienter 60 secondes avant de redemander un code" },
        { status: 429 }
      );
    }

    // Verify email belongs to an active intervenant or super_admin
    const { data: intervenant } = await supabase
      .from("intervenants")
      .select("id")
      .eq("email", lowerEmail)
      .eq("is_active", true)
      .limit(1);

    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("email", lowerEmail)
      .eq("is_active", true)
      .limit(1);

    if (
      (!intervenant || intervenant.length === 0) &&
      (!superAdmin || superAdmin.length === 0)
    ) {
      return NextResponse.json(
        { error: "Email non reconnu" },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // Hash and store (reuse "phone" column for email — it's the identifier)
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabase.from("otp_codes").insert({
      phone: lowerEmail,
      code_hash: codeHash,
      expires_at: expiresAt,
    });

    // Send OTP via email
    await sendOtpEmail(lowerEmail, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[request-otp] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du code" },
      { status: 500 }
    );
  }
}
