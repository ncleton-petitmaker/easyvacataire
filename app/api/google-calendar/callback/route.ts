import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const intervenantId = req.nextUrl.searchParams.get("state");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code || !intervenantId) {
    return NextResponse.redirect(`${baseUrl}/mes/creneaux?google=error`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    console.log("[google-callback] tokens received, saving for intervenant:", intervenantId);
    const supabase = getServiceClient();

    const { error } = await supabase.from("google_oauth_tokens").upsert(
      {
        intervenant_id: intervenantId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "intervenant_id" }
    );

    if (error) {
      console.error("[google-callback] upsert error:", error);
      return NextResponse.redirect(`${baseUrl}/mes/creneaux?google=error`);
    }

    console.log("[google-callback] tokens saved successfully");
    return NextResponse.redirect(`${baseUrl}/mes/creneaux?google=connected`);
  } catch (err) {
    console.error("[google-callback] exception:", err);
    return NextResponse.redirect(`${baseUrl}/mes/creneaux?google=error`);
  }
}
