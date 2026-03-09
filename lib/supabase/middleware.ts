import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (err) {
    console.error("[middleware] getUser error:", err);
  }

  const pathname = request.nextUrl.pathname;
  console.log("[middleware]", pathname, "user:", user?.id ?? "null", "role:", user?.user_metadata?.role ?? "none");

  // Public routes that don't require auth
  const publicPrefixes = ["/login", "/api/auth", "/api/whatsapp-webhook", "/api/whatsapp-meta-webhook", "/api/cron", "/api/chat-agent", "/api/conversations", "/dispos", "/conditions-utilisation", "/politique-de-confidentialite"];
  const publicExact = ["/", "/sitemap.xml", "/manifest.json"];
  const isPublic = publicExact.includes(pathname) || publicPrefixes.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    console.log("[middleware] REDIRECTING to /login (user is null, path is protected)");
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  console.log("[middleware] NOT redirecting, user:", !!user, "isPublic:", isPublic);

  // Role-based route protection (from user_metadata)
  if (user) {
    const role = user.user_metadata?.role as string | undefined;

    // Protect admin-only API routes
    const adminApiPrefixes = [
      "/api/besoins",
      "/api/matching",
      "/api/intervenants",
      "/api/matieres",
      "/api/import",
      "/api/knowledge",
      "/api/disponibilites/token",
    ];
    const superAdminApiPrefixes = ["/api/etablissements"];

    if (superAdminApiPrefixes.some((p) => pathname.startsWith(p)) && role !== "super_admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    if (adminApiPrefixes.some((p) => pathname.startsWith(p)) && role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Protect PATCH/POST on creneaux (vacataire can only GET)
    if (pathname.startsWith("/api/creneaux") && request.method !== "GET" && role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (pathname.startsWith("/super-admin") && role !== "super_admin") {
      const url = request.nextUrl.clone();
      if (role === "admin") {
        url.pathname = "/admin/creneaux";
      } else {
        url.pathname = "/mes/creneaux";
      }
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin") && role !== "super_admin" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/vacataire/suivi";
      return NextResponse.redirect(url);
    }

    if ((pathname.startsWith("/mes") || pathname.startsWith("/vacataire")) && (role === "super_admin" || role === "admin")) {
      const url = request.nextUrl.clone();
      if (role === "super_admin") {
        url.pathname = "/super-admin";
      } else {
        url.pathname = "/admin/creneaux";
      }
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
