import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import MesLayoutClient from "./layout-client";

export const dynamic = "force-dynamic";

export default async function MesLayout({
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
  await supabase.auth.getUser();
  return <MesLayoutClient>{children}</MesLayoutClient>;
}
