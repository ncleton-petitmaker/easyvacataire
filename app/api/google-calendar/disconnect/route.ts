import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revokeGoogleTokens } from "@/lib/google-calendar";
import { getServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: intervenant } = await supabase
    .from("intervenants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!intervenant) {
    return NextResponse.json({ error: "Intervenant introuvable" }, { status: 403 });
  }

  await revokeGoogleTokens(intervenant.id);

  // Supprimer les dispos générées automatiquement depuis Google
  const serviceClient = getServiceClient();
  await serviceClient
    .from("disponibilites_intervenant")
    .delete()
    .eq("intervenant_id", intervenant.id)
    .eq("source", "google_auto");

  return NextResponse.json({ success: true });
}
