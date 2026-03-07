import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import SuperAdminLayoutClient from "./layout-client";

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role ?? "intervenant";
  return <SuperAdminLayoutClient role={role}>{children}</SuperAdminLayoutClient>;
}
