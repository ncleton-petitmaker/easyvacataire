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
  const publicPaths = ["/", "/login", "/api/auth", "/api/whatsapp-webhook", "/api/whatsapp-meta-webhook", "/api/cron", "/api/chat-agent", "/api/conversations", "/dispos", "/conditions-utilisation", "/politique-de-confidentialite", "/sitemap.xml", "/manifest.json"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

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
      url.pathname = "/mes/creneaux";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/mes") && (role === "super_admin" || role === "admin")) {
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
