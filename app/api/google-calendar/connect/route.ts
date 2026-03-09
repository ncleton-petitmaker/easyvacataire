import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const { data: intervenant } = await supabase
    .from("intervenants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!intervenant) {
    return NextResponse.json({ error: "Intervenant introuvable" }, { status: 403 });
  }

  const authUrl = getGoogleAuthUrl(intervenant.id);
  return NextResponse.redirect(authUrl);
}
