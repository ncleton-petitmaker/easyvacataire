import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import AdminLayoutClient from "./layout-client";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
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
  return <AdminLayoutClient role={role}>{children}</AdminLayoutClient>;
}
