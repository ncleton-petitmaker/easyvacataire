import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Code invalide" },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase().trim();
    const sb = getServiceClient();

    // Find the latest unused, non-expired OTP for this email
    // (otp_codes.phone column stores the email identifier)
    const { data: otpRows } = await sb
      .from("otp_codes")
      .select("*")
      .eq("phone", lowerEmail)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (!otpRows || otpRows.length === 0) {
      return NextResponse.json(
        { error: "Code expiré ou introuvable. Redemandez un code." },
        { status: 401 }
      );
    }

    const otp = otpRows[0];

    // Check max attempts
    if (otp.attempts >= 5) {
      await sb
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otp.id);
      return NextResponse.json(
        { error: "Trop de tentatives. Redemandez un code." },
        { status: 401 }
      );
    }

    // Compare code with hash
    const valid = await bcrypt.compare(code, otp.code_hash);
    if (!valid) {
      await sb
        .from("otp_codes")
        .update({ attempts: otp.attempts + 1 })
        .eq("id", otp.id);
      return NextResponse.json(
        { error: "Code incorrect" },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await sb
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otp.id);

    // Find or create auth user using the real email
    const { data: userList } = await sb.auth.admin.listUsers();
    let authUser = userList?.users?.find((u) => u.email === lowerEmail);

    if (!authUser) {
      const { data: created, error: createError } =
        await sb.auth.admin.createUser({
          email: lowerEmail,
          email_confirm: true,
          user_metadata: { email: lowerEmail, auth_method: "email_otp" },
        });
      if (createError) {
        console.error("Failed to create auth user:", createError);
        return NextResponse.json(
          { error: "Erreur interne" },
          { status: 500 }
        );
      }
      authUser = created.user;
    }

    // Link user_id if not already set
    await sb
      .from("intervenants")
      .update({ user_id: authUser.id })
      .eq("email", lowerEmail)
      .is("user_id", null);

    await sb
      .from("super_admins")
      .update({ user_id: authUser.id })
      .eq("email", lowerEmail)
      .is("user_id", null);

    // Generate magic link to get session tokens
    const { data: linkData, error: linkError } =
      await sb.auth.admin.generateLink({
        type: "magiclink",
        email: lowerEmail,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Failed to generate magic link:", linkError);
      return NextResponse.json(
        { error: "Erreur interne" },
        { status: 500 }
      );
    }

    // Verify the token server-side to get session tokens
    const { data: sessionData, error: verifyError } = await sb.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (verifyError || !sessionData?.session) {
      console.error("Server-side verifyOtp failed:", verifyError);
      return NextResponse.json(
        { error: "Erreur interne" },
        { status: 500 }
      );
    }

    // Determine role: super_admin > admin > intervenant
    const sb2 = getServiceClient();

    const { data: superAdmin } = await sb2
      .from("super_admins")
      .select("id")
      .eq("email", lowerEmail)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    let role = "intervenant";
    if (superAdmin) {
      role = "super_admin";
    } else {
      const { data: intervenant } = await sb2
        .from("intervenants")
        .select("role")
        .eq("email", lowerEmail)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (intervenant?.role === "admin") role = "admin";
    }

    // Persist role in user_metadata
    await sb2.auth.admin.updateUserById(authUser.id, {
      user_metadata: { role, email: lowerEmail },
    });

    return NextResponse.json({
      success: true,
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      role,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
